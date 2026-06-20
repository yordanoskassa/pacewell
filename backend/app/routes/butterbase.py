from fastapi import APIRouter

from ..services.butterbase_service import butterbase

router = APIRouter(prefix="/butterbase", tags=["butterbase"])


@router.get("/status")
async def butterbase_status():
    """
    Check PaceWell's connection to the Butterbase backend platform.

    Used for hackathon demos and deployment health checks.
    """
    status = await butterbase.health_check()
    return {
        "platform": "Butterbase",
        "docs": "https://docs.butterbase.ai",
        **status,
    }
