from .session import engine, Base
from ..models import models  # noqa: F401


def init_db():
    Base.metadata.create_all(bind=engine)
