@echo off
echo Setting up Python Environment...
if not exist venv313 (
    py -3.13 -m venv venv313
    echo Virtual Environment venv313 Created.
)

echo Activating venv313...
call venv313\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Starting Backend Server...
uvicorn main:app --reload --port 8000

pause
