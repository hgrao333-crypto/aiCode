from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    secret_key: str = "dev-secret-key-change-in-production"
    database_url: str = "sqlite:///./logos.db"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"


settings = Settings()
