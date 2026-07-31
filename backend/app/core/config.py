from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str
    model_name: str = "gemini-2.0-flash"
    fallback_model_name: str = "gemini-2.0-flash"
    # Rate Limiting
    rpm_limit: int = 15
    rpd_limit: int = 1500

    # App
    cors_origins: str = "http://localhost:5173"
    max_file_size_mb: int = 5

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # UPDATED: Modern Pydantic V2 syntax
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()