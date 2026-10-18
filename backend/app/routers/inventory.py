from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import InventoryItem
from backend.app.schemas import InventoryItemResponse
from backend.app.engines.inventory_engine import inventory_engine

router = APIRouter(prefix="/api/v1/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryItemResponse])
def list_inventory(
    facility: Optional[str] = Query(None, description="Filter by healthcare facility name"),
    shortage_only: bool = Query(False, description="Filter items predicting shortage"),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem)
    if facility:
        query = query.filter(InventoryItem.facility_name.ilike(f"%{facility}%"))
    if shortage_only:
        query = query.filter(InventoryItem.is_shortage_predicted == True)
    
    items = query.order_by(InventoryItem.is_shortage_predicted.desc(), InventoryItem.estimated_hours_remaining.asc()).all()
    # Refresh coverage calculations
    for it in items:
        inventory_engine.evaluate_inventory_health(it, db)
    return items

@router.post("/{item_id}/recalculate", response_model=InventoryItemResponse)
def recalculate_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    inventory_engine.evaluate_inventory_health(item, db)
    return item
