from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import AuditLog
from backend.app.schemas import AuditLogResponse

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (EVENT, SHIPMENT, ALERT, INVENTORY)"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type.upper())
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type.upper())
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
