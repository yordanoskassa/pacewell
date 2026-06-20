from cryptography.fernet import Fernet
from .config import settings


def get_fernet() -> Fernet:
    return Fernet(settings.fernet_key.encode())


def encrypt_token(token: str) -> str:
    f = get_fernet()
    return f.encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    f = get_fernet()
    return f.decrypt(encrypted.encode()).decode()
