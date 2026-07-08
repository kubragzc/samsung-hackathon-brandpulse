import os
import json
import re
from typing import Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

from prompts.audience_analysis import get_audience_analysis_prompt
from prompts.content_generation import get_content_generation_prompt
from prompts.ethical_review import get_ethical_review_prompt
from prompts.brand_voice import get_brand_voice_system_prompt

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY ortam değişkeni ayarlanmamış. "
        "Lütfen .env dosyasına GEMINI_API_KEY=... satırını ekleyin."
    )

genai.configure(api_key=GEMINI_API_KEY)

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="BrandPulse",
    description="Yapay Zekâ Destekli Marka Lansman Asistanı",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & Jinja2 templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class BrandData(BaseModel):
    brand_name: str
    industry: str
    product_name: str
    product_description: str
    campaign_goal: str
    target_market: str
    brand_tone: str
    knowledge_base: str | None = None
    product_image_base64: str | None = None
    custom_image_prompt: str | None = None


class ContentRequest(BaseModel):
    brand_data: dict[str, Any]
    segments: list[dict[str, Any]]


class EthicsRequest(BaseModel):
    brand_data: dict[str, Any] | None = None
    all_content: list[dict[str, Any]]


class ImageRequest(BaseModel):
    brand_data: dict[str, Any]
    image_prompt: str


# ---------------------------------------------------------------------------
# Gemini Helpers
# ---------------------------------------------------------------------------

MODEL_NAME = "gemini-flash-lite-latest"


def _parse_json_response(text: str) -> dict | list:
    """
    Parse JSON from a Gemini response that may be wrapped in markdown
    code blocks (```json ... ``` or ``` ... ```).
    """
    # Try to extract from markdown code block first
    patterns = [
        r"```json\s*\n?(.*?)\n?\s*```",
        r"```\s*\n?(.*?)\n?\s*```",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                continue

    # Fallback: try to find raw JSON object or array
    start_obj = text.find("{")
    start_arr = text.find("[")

    if start_obj == -1 and start_arr == -1:
        raise ValueError("Gemini yanıtında JSON verisi bulunamadı.")

    if start_arr == -1 or (start_obj != -1 and start_obj < start_arr):
        end = text.rfind("}")
        if end == -1:
            raise ValueError("Gemini yanıtında JSON nesnesi tamamlanamadı.")
        json_str = text[start_obj : end + 1]
    else:
        end = text.rfind("]")
        if end == -1:
            raise ValueError("Gemini yanıtında JSON dizisi tamamlanamadı.")
        json_str = text[start_arr : end + 1]

    return json.loads(json_str)


def _call_gemini(
    prompt: str,
    *,
    system_prompt: str | None = None,
    temperature: float = 0.7,
) -> str:
    """Send a prompt to the Gemini model and return the text response."""
    generation_config = genai.types.GenerationConfig(
        temperature=temperature,
        top_p=0.95,
        max_output_tokens=8192,
    )

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=system_prompt,
        generation_config=generation_config,
    )

    response = model.generate_content(prompt)
    return response.text


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Serve the main frontend page."""
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/api/audience-analysis")
async def audience_analysis(brand_data: BrandData):
    """
    Analyse the audience using Chain-of-Thought prompting.
    Returns the parsed audience segments directly.
    """
    try:
        data_dict = brand_data.model_dump()
        prompt = get_audience_analysis_prompt(data_dict)
        system_prompt = get_brand_voice_system_prompt(data_dict)

        raw = _call_gemini(prompt, system_prompt=system_prompt, temperature=0.3)
        result = _parse_json_response(raw)

        # Return the parsed result directly (no wrapper)
        return result

    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini yanıtı JSON olarak ayrıştırılamadı: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Hedef kitle analizi sırasında hata oluştu: {exc}",
        )


@app.post("/api/generate-content")
async def generate_content(payload: ContentRequest):
    """
    Generate marketing content for ALL segments × ALL channels using Few-Shot prompting.
    Returns an array of segment content objects.
    """
    try:
        brand_data = payload.brand_data
        segments = payload.segments

        if not segments:
            raise HTTPException(status_code=400, detail="Segment listesi boş.")

        channels = ["instagram", "email", "web_banner"]
        system_prompt = get_brand_voice_system_prompt(brand_data)

        all_content = []

        for segment in segments:
            segment_content = {
                "segment_name": segment.get("name", "Bilinmiyor"),
                "channels": {},
            }

            for channel in channels:
                prompt = get_content_generation_prompt(brand_data, segment, channel)
                raw = _call_gemini(
                    prompt, system_prompt=system_prompt, temperature=0.9
                )

                try:
                    parsed = _parse_json_response(raw)
                except (json.JSONDecodeError, ValueError):
                    # If JSON parsing fails, keep the raw text
                    parsed = {"raw_content": raw}

                segment_content["channels"][channel] = parsed

            all_content.append(segment_content)

        # Return the array directly
        return all_content

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"İçerik üretimi sırasında hata oluştu: {exc}",
        )


@app.post("/api/ethical-review")
async def ethical_review(payload: EthicsRequest):
    """
    Run a Zero-Shot ethical review on all generated content.
    Returns the parsed ethics assessment directly.
    """
    try:
        all_content = payload.all_content

        if not all_content:
            raise HTTPException(status_code=400, detail="İçerik listesi boş.")

        # Format all content into a readable text block for the prompt
        formatted_parts = []
        for item in all_content:
            segment_name = item.get("segment_name", "Bilinmiyor")
            channels = item.get("channels", {})

            for channel, content in channels.items():
                formatted_parts.append(
                    f"### Segment: {segment_name} | Kanal: {channel}\n"
                    f"```json\n{json.dumps(content, ensure_ascii=False, indent=2)}\n```"
                )

        all_content_text = "\n\n".join(formatted_parts)

        prompt = get_ethical_review_prompt(all_content_text)
        raw = _call_gemini(prompt, temperature=0.3)
        result = _parse_json_response(raw)

        # Return the parsed result directly
        return result

    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Etik değerlendirme yanıtı JSON olarak ayrıştırılamadı: {exc}",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Etik değerlendirme sırasında hata oluştu: {exc}",
        )


@app.post("/api/generate-image")
async def generate_image_api(payload: ImageRequest):
    """
    Generate an image using the gemini-3.1-flash-image model.
    Accepts an optional product_image_base64 to do image-to-image styling.
    """
    try:
        brand_data = payload.brand_data
        image_prompt = payload.image_prompt
        custom_prompt = brand_data.get("custom_image_prompt")
        
        final_prompt = custom_prompt.strip() if custom_prompt and custom_prompt.strip() else image_prompt

        from google import genai
        import base64
        
        client = genai.Client()
        
        product_image_b64 = brand_data.get("product_image_base64")
        
        input_data = []
        if product_image_b64:
            # The base64 string might have 'data:image/jpeg;base64,' prefix. 
            # We need to strip it if present.
            if "," in product_image_b64:
                header, b64_data = product_image_b64.split(",", 1)
                mime_type = header.split(":")[1].split(";")[0]
            else:
                b64_data = product_image_b64
                mime_type = "image/jpeg" # fallback
                
            input_data.append({
                "type": "image",
                "data": b64_data,
                "mime_type": mime_type
            })
            
            # Combine the image with the prompt instruction
            input_data.append({
                "type": "text",
                "text": f"Use the provided product image and transform it into a launch scene based on the following instruction: {final_prompt}"
            })
        else:
            input_data = final_prompt
            
        interaction = client.interactions.create(
            model="gemini-3.1-flash-image",
            input=input_data
        )
        
        # Parse the response. The interaction returns output_image.data which is raw bytes (actually bytes of the image).
        # We need to return base64. Wait, the docs say interaction.output_image.data is the base64 string or bytes?
        # Docs say: f.write(base64.b64decode(interaction.output_image.data)) -> meaning it IS a base64 encoded string/bytes!
        # If it's bytes, we decode to str to return it in JSON.
        img_data = interaction.output_image.data
        if isinstance(img_data, bytes):
            # Try decoding it if it's base64 bytes
            try:
                b64_str = img_data.decode("utf-8")
            except:
                b64_str = base64.b64encode(img_data).decode("utf-8")
        else:
            b64_str = img_data
            
        return {"success": True, "image_base64": f"data:image/jpeg;base64,{b64_str}"}

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Görsel üretimi sırasında hata oluştu: {exc}",
        )

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
