from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    app_name: str = "TRI-MATSYA"
    app_env: str = "development"
    database_url: str = "sqlite:///./data/trimatsya.db"
    secret_key: str = "change-this-to-a-long-random-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 30
    otp_provider: str = "console"
    whatsapp_token: str | None = None
    whatsapp_phone_number_id: str | None = None
    whatsapp_verify_token: str | None = None
    whatsapp_contact_number: str | None = None
    n8n_webhook_url: str | None = None
    n8n_webhook_secret: str | None = None
    cors_origins: str = "http://localhost:3000,http://localhost:8000,http://127.0.0.1:8000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
