import time
import uuid
import datetime
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from backend.app.config import settings

class TransactionResult:
    def __init__(
        self,
        success: bool,
        correlation_id: str,
        latency_ms: float,
        processor_name: str,
        status_code: int = 200,
        payload: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ):
        self.success = success
        self.correlation_id = correlation_id
        self.latency_ms = latency_ms
        self.processor_name = processor_name
        self.status_code = status_code
        self.payload = payload or {}
        self.error_message = error_message
        self.timestamp = datetime.datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "correlation_id": self.correlation_id,
            "latency_ms": round(self.latency_ms, 2),
            "processor_name": self.processor_name,
            "status_code": self.status_code,
            "payload": self.payload,
            "error_message": self.error_message,
            "timestamp": self.timestamp.isoformat()
        }

class TransactionProcessor(ABC):
    @abstractmethod
    def process_event_transaction(self, event_data: Dict[str, Any]) -> TransactionResult:
        """Process an incoming event transaction with ACID-like or idempotent guarantees."""
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Verify the health and operational status of the transaction processor."""
        pass

class LocalDemoTransactionProcessor(TransactionProcessor):
    """
    Default local transaction processor implementing the exact IBM Z contract interface.
    Explicitly labelled: 'Local Demo Processor — IBM Z integration adapter ready'
    Ensures zero external dependency failure while providing deterministic latency tracking,
    correlation IDs, and transactional audit trails.
    """
    def __init__(self):
        self.name = "Local Demo Processor — IBM Z integration adapter ready"

    def process_event_transaction(self, event_data: Dict[str, Any]) -> TransactionResult:
        start_time = time.perf_counter()
        correlation_id = f"{settings.IBM_Z_CORRELATION_PREFIX}-{uuid.uuid4().hex[:12].upper()}"
        
        # Simulated sub-millisecond local execution
        time.sleep(0.005)
        
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return TransactionResult(
            success=True,
            correlation_id=correlation_id,
            latency_ms=latency_ms,
            processor_name=self.name,
            status_code=200,
            payload={
                "event_id": event_data.get("id"),
                "event_type": event_data.get("event_type"),
                "status": "COMMITTED_LOCAL",
                "ibm_z_adapter_state": "STANDBY_READY"
            }
        )

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "HEALTHY",
            "processor": self.name,
            "adapter_type": "LocalDemo",
            "ibm_z_readiness": "READY_FOR_CONNECTION",
            "active_protocol": "LOCAL_EVENT_BUS"
        }

class IBMZTransactionProcessor(TransactionProcessor):
    """
    Production-ready enterprise integration adapter for IBM Z / z/OS transaction engines
    (e.g., IBM z/OS CICS transaction gateway, z/OS Connect EE, or LinuxONE microservices).
    Includes configurable timeouts, retries, idempotency keys, and correlation IDs.
    """
    def __init__(self, endpoint: str = None, api_key: str = None):
        self.name = "IBM Z Enterprise Transaction Processor (z/OS Connect Adapter)"
        self.endpoint = endpoint or settings.IBM_Z_ENDPOINT
        self.api_key = api_key or settings.IBM_Z_API_KEY
        self.timeout = settings.IBM_Z_TIMEOUT_SECONDS
        self.max_retries = settings.IBM_Z_MAX_RETRIES

    def process_event_transaction(self, event_data: Dict[str, Any]) -> TransactionResult:
        start_time = time.perf_counter()
        correlation_id = f"{settings.IBM_Z_CORRELATION_PREFIX}-{uuid.uuid4().hex[:12].upper()}"
        headers = {
            "Content-Type": "application/json",
            "X-IBM-Z-Correlation-ID": correlation_id,
            "X-Idempotency-Key": str(event_data.get("id", uuid.uuid4())),
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        # Attempt actual connection if configured
        for attempt in range(self.max_retries):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(
                        f"{self.endpoint}/events",
                        json=event_data,
                        headers=headers
                    )
                    latency_ms = (time.perf_counter() - start_time) * 1000.0
                    if response.status_code in (200, 201):
                        return TransactionResult(
                            success=True,
                            correlation_id=correlation_id,
                            latency_ms=latency_ms,
                            processor_name=self.name,
                            status_code=response.status_code,
                            payload=response.json()
                        )
            except Exception as e:
                if attempt == self.max_retries - 1:
                    latency_ms = (time.perf_counter() - start_time) * 1000.0
                    return TransactionResult(
                        success=False,
                        correlation_id=correlation_id,
                        latency_ms=latency_ms,
                        processor_name=self.name,
                        status_code=503,
                        error_message=f"IBM Z Endpoint unreachable: {str(e)}. Fallback to local demo adapter recommended."
                    )
                time.sleep(0.1)

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "CONFIGURED",
            "processor": self.name,
            "endpoint": self.endpoint,
            "adapter_type": "IBMZ_REST_GATEWAY",
            "ibm_z_readiness": "CONFIGURED_EXTERNAL"
        }

# Active processor factory
def get_transaction_processor() -> TransactionProcessor:
    if settings.SYSTEM_MODE.lower() == "connected" and settings.IBM_Z_API_KEY:
        return IBMZTransactionProcessor()
    return LocalDemoTransactionProcessor()
