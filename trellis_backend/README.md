# TRELLIS Local API (for GitHub Pages frontend)

Backend code can be stored in GitHub, but GitHub Pages does not run Python servers.  
Run this API locally (or on your own server), then set the URL in `part_photo_3d.html`.

## 1) Install

```bash
cd trellis_backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Start in mock mode (UI test)

```bash
set TRELLIS_MOCK_MODE=1
python app.py
```

Then use: `http://127.0.0.1:8000/generate`

## 3) Real TRELLIS command mode

Set command that receives image input and writes GLB output:

```bash
set TRELLIS_CMD=python your_trellis_runner.py --input {input} --output {output}
python app.py
```

Requirements for your command:
- `{input}`: path to uploaded image
- `{output}`: path where GLB must be written
- command exit code must be `0` on success

Endpoint response format:

```json
{
  "ok": true,
  "modelUrl": "http://127.0.0.1:8000/outputs/model_xxx.glb",
  "mode": "trellis"
}
```

## 4) Connect from website

In module `PHOTO -> 3D RELIEF` choose `TRELLIS 2` mode and paste:

`http://127.0.0.1:8000/generate`

