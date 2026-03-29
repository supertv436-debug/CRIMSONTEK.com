import os
import shlex
import subprocess
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles


APP_HOST = os.getenv("TRELLIS_HOST", "127.0.0.1")
APP_PORT = int(os.getenv("TRELLIS_PORT", "8000"))
TRELLIS_CMD = os.getenv("TRELLIS_CMD", "").strip()
MOCK_MODE = os.getenv("TRELLIS_MOCK_MODE", "0").strip() == "1"

BASE_DIR = Path(__file__).resolve().parent
OUTPUTS_DIR = BASE_DIR / "outputs"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="CRIMSONTEK TRELLIS Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")


@app.get("/health")
def health():
    return {
        "ok": True,
        "mock_mode": MOCK_MODE,
        "cmd_configured": bool(TRELLIS_CMD),
        "hint": "POST /generate with multipart field `image`",
    }


def _run_trellis_cmd(image_path: Path, out_glb_path: Path) -> None:
    if not TRELLIS_CMD:
        raise HTTPException(
            status_code=501,
            detail=(
                "TRELLIS_CMD is not configured. "
                "Set env TRELLIS_CMD with placeholders {input} and {output}."
            ),
        )

    cmd = TRELLIS_CMD.format(
        input=shlex.quote(str(image_path)),
        output=shlex.quote(str(out_glb_path)),
    )
    proc = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        timeout=60 * 20,
    )
    if proc.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=(
                "TRELLIS process failed.\n"
                f"stdout: {proc.stdout[-1200:]}\n"
                f"stderr: {proc.stderr[-1200:]}"
            ),
        )

    if not out_glb_path.exists() or out_glb_path.stat().st_size == 0:
        raise HTTPException(status_code=500, detail="TRELLIS did not produce output GLB.")


@app.post("/generate")
async def generate(image: UploadFile = File(...)):
    suffix = Path(image.filename or "upload.jpg").suffix or ".jpg"

    with tempfile.TemporaryDirectory(prefix="trellis_in_") as td:
        in_path = Path(td) / f"input{suffix}"
        data = await image.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty image upload.")
        in_path.write_bytes(data)

        out_name = f"model_{uuid.uuid4().hex}.glb"
        out_path = OUTPUTS_DIR / out_name

        if MOCK_MODE:
            return JSONResponse(
                {
                    "ok": True,
                    "modelUrl": "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
                    "mode": "mock",
                }
            )

        _run_trellis_cmd(in_path, out_path)

        return {
            "ok": True,
            "modelUrl": f"http://{APP_HOST}:{APP_PORT}/outputs/{out_name}",
            "mode": "trellis",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host=APP_HOST, port=APP_PORT, reload=False)
