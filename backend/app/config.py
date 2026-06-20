from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/fitbit/callback"
    fernet_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    frontend_url: str = "http://localhost:5173"
    port: int = 8000
    butterbase_app_id: str = ""
    butterbase_api_url: str = "https://api.butterbase.ai"
    butterbase_api_key: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
