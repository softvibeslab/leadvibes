"""
Characterization tests for existing model patterns.

These tests capture the CURRENT BEHAVIOR of the model system
to ensure new models follow the same patterns.
"""
import pytest
from datetime import datetime, timezone
from models import (
    generate_uuid,
    now_utc,
    Lead,
    LeadStatus,
    LeadPriority,
    User,
    Activity,
    ActivityType,
    ImportStatus,
    ExportFormat,
    ImportJob,
    ImportJobCreate,
    ImportLog,
    ImportLogCreate,
    ExportTemplate,
    ExportTemplateCreate,
)


class TestHelperFunctions:
    """Tests for utility functions."""

    def test_generate_uuid_creates_string(self):
        """UUID generation should produce string values."""
        uuid1 = generate_uuid()
        uuid2 = generate_uuid()

        # Should be strings
        assert isinstance(uuid1, str)
        assert isinstance(uuid2, str)

        # Should be unique
        assert uuid1 != uuid2

        # Should be non-empty
        assert len(uuid1) > 0
        assert len(uuid2) > 0

    def test_now_utc_returns_datetime(self):
        """UTC now should return datetime with UTC timezone."""
        result = now_utc()

        # Should be datetime
        assert isinstance(result, datetime)

        # Should have UTC timezone
        assert result.tzinfo == timezone.utc


class TestEnumPattern:
    """Tests for enum pattern behavior."""

    def test_enum_inheritance(self):
        """Enums should inherit from str and Enum."""
        assert issubclass(LeadStatus, str)
        assert issubclass(LeadPriority, str)

    def test_enum_values_are_strings(self):
        """Enum values should be lowercase strings."""
        assert LeadStatus.NUEVO == "nuevo"
        assert LeadPriority.BAJA == "baja"

    def test_enum_names_are_uppercase(self):
        """Enum names should be uppercase."""
        assert "NUEVO" in LeadStatus.__members__
        assert "BAJA" in LeadPriority.__members__


class TestModelPattern:
    """Tests for Pydantic model pattern behavior."""

    def test_model_id_generation(self):
        """Models should auto-generate UUID IDs."""
        lead = Lead(name="Test", phone="1234567890", tenant_id="test-tenant")

        # Should have auto-generated ID
        assert lead.id is not None
        assert isinstance(lead.id, str)
        assert len(lead.id) > 0

    def test_model_datetime_generation(self):
        """Models should auto-generate UTC timestamps."""
        lead = Lead(name="Test", phone="1234567890", tenant_id="test-tenant")

        # Should have created_at timestamp
        assert lead.created_at is not None
        assert isinstance(lead.created_at, datetime)
        assert lead.created_at.tzinfo == timezone.utc

    def test_model_extra_ignore_config(self):
        """Models should ignore extra fields."""
        data = {
            "name": "Test",
            "phone": "1234567890",
            "tenant_id": "test-tenant",
            "extra_field": "should_be_ignored"
        }
        lead = Lead(**data)

        # Should not have extra field
        assert not hasattr(lead, "extra_field") or lead.model_extra is None

    def test_model_optional_fields(self):
        """Models should handle optional fields correctly."""
        lead = Lead(
            name="Test",
            phone="1234567890",
            tenant_id="test-tenant"
        )

        # Optional fields should default to None
        assert lead.email is None
        assert lead.property_interest is None

    def test_model_default_values(self):
        """Models should use default values correctly."""
        lead = Lead(
            name="Test",
            phone="1234567890",
            tenant_id="test-tenant"
        )

        # Should have default status
        assert lead.status == LeadStatus.NUEVO
        assert lead.priority == LeadPriority.MEDIA

    def test_model_enum_fields(self):
        """Models should accept enum values."""
        lead = Lead(
            name="Test",
            phone="1234567890",
            tenant_id="test-tenant",
            status=LeadStatus.CONTACTADO,
            priority=LeadPriority.ALTA
        )

        assert lead.status == LeadStatus.CONTACTADO
        assert lead.priority == LeadPriority.ALTA


class TestModelWithDictField:
    """Tests for models with Dict field types."""

    def test_dict_field_optional(self):
        """Dict fields should be optional and accept None."""
        lead = Lead(
            name="Test",
            phone="1234567890",
            tenant_id="test-tenant"
        )

        assert lead.ai_analysis is None

    def test_dict_field_accepts_data(self):
        """Dict fields should accept dictionary data."""
        ai_data = {"score": 0.85, "category": "hot"}
        lead = Lead(
            name="Test",
            phone="1234567890",
            tenant_id="test-tenant",
            ai_analysis=ai_data
        )

        assert lead.ai_analysis == ai_data
        assert lead.ai_analysis["score"] == 0.85


class TestModelWithListField:
    """Tests for models with List field types."""

    def test_list_field_default_empty(self):
        """List fields should default to empty list."""
        from models import ScriptCreate

        script = ScriptCreate(
            title="Test Script",
            category="sales",
            content="Test content"
        )

        assert script.tags == []


class TestImportExportEnums:
    """Tests for Import/Export enum patterns."""

    def test_import_status_enum_pattern(self):
        """ImportStatus should follow established enum pattern."""
        assert issubclass(ImportStatus, str)
        assert ImportStatus.PENDING == "pending"
        assert ImportStatus.PROCESSING == "processing"
        assert ImportStatus.COMPLETED == "completed"
        assert ImportStatus.FAILED == "failed"

    def test_export_format_enum_pattern(self):
        """ExportFormat should follow established enum pattern."""
        assert issubclass(ExportFormat, str)
        assert ExportFormat.PDF == "pdf"
        assert ExportFormat.XLSX == "xlsx"
        assert ExportFormat.CSV == "csv"
        assert ExportFormat.JSON == "json"


class TestImportJobModel:
    """Tests for ImportJob model pattern."""

    def test_import_job_follows_model_pattern(self):
        """ImportJob should follow established model pattern."""
        job = ImportJob(
            filename="test.csv",
            file_type="csv",
            tenant_id="tenant-123",
            user_id="user-123"
        )

        # Should have auto-generated ID
        assert job.id is not None
        assert isinstance(job.id, str)

        # Should have created_at timestamp
        assert job.created_at is not None
        assert isinstance(job.created_at, datetime)
        assert job.created_at.tzinfo == timezone.utc

        # Should have default status
        assert job.status == ImportStatus.PENDING

        # Should have default counters
        assert job.total_leads == 0
        assert job.successful_leads == 0
        assert job.failed_leads == 0
        assert job.duplicate_leads == 0

    def test_import_job_optional_completed_at(self):
        """ImportJob should have optional completed_at field."""
        job = ImportJob(
            filename="test.csv",
            file_type="csv",
            tenant_id="tenant-123",
            user_id="user-123"
        )

        # completed_at should be None initially
        assert job.completed_at is None

        # Should accept datetime when provided
        completion_time = now_utc()
        job_data = {
            "filename": "test.csv",
            "file_type": "csv",
            "tenant_id": "tenant-123",
            "user_id": "user-123",
            "completed_at": completion_time
        }
        job_with_completion = ImportJob(**job_data)
        assert job_with_completion.completed_at == completion_time

    def test_import_job_create_pattern(self):
        """ImportJobCreate should follow create model pattern."""
        job_create = ImportJobCreate(
            filename="leads.csv",
            file_type="csv"
        )

        assert job_create.filename == "leads.csv"
        assert job_create.file_type == "csv"


class TestImportLogModel:
    """Tests for ImportLog model pattern."""

    def test_import_log_follows_model_pattern(self):
        """ImportLog should follow established model pattern."""
        lead_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "1234567890"
        }

        log = ImportLog(
            import_job_id="job-123",
            lead_data=lead_data,
            status="success"
        )

        # Should have auto-generated ID
        assert log.id is not None
        assert isinstance(log.id, str)

        # Should have created_at timestamp
        assert log.created_at is not None
        assert isinstance(log.created_at, datetime)
        assert log.created_at.tzinfo == timezone.utc

        # Should store lead data
        assert log.lead_data == lead_data

    def test_import_log_optional_error_message(self):
        """ImportLog should have optional error_message field."""
        lead_data = {"name": "Test"}

        # Should work without error_message
        log = ImportLog(
            import_job_id="job-123",
            lead_data=lead_data,
            status="success"
        )
        assert log.error_message is None

        # Should accept error_message when provided
        log_with_error = ImportLog(
            import_job_id="job-123",
            lead_data=lead_data,
            status="failed",
            error_message="Invalid email format"
        )
        assert log_with_error.error_message == "Invalid email format"


class TestExportTemplateModel:
    """Tests for ExportTemplate model pattern."""

    def test_export_template_follows_model_pattern(self):
        """ExportTemplate should follow established model pattern."""
        columns = ["name", "email", "phone", "status"]

        template = ExportTemplate(
            name="Weekly Leads Report",
            format=ExportFormat.PDF,
            columns=columns,
            tenant_id="tenant-123",
            created_by="user-123"
        )

        # Should have auto-generated ID
        assert template.id is not None
        assert isinstance(template.id, str)

        # Should have created_at timestamp
        assert template.created_at is not None
        assert isinstance(template.created_at, datetime)
        assert template.created_at.tzinfo == timezone.utc

        # Should store template data
        assert template.name == "Weekly Leads Report"
        assert template.format == ExportFormat.PDF
        assert template.columns == columns

    def test_export_template_optional_filters(self):
        """ExportTemplate should have optional filters field."""
        columns = ["name", "email"]

        # Should work without filters
        template = ExportTemplate(
            name="Simple Export",
            format=ExportFormat.CSV,
            columns=columns,
            tenant_id="tenant-123",
            created_by="user-123"
        )
        assert template.filters is None

        # Should accept filters when provided
        filters = {"status": "nuevo", "priority": "alta"}
        template_with_filters = ExportTemplate(
            name="Filtered Export",
            format=ExportFormat.EXCEL,
            columns=columns,
            filters=filters,
            tenant_id="tenant-123",
            created_by="user-123"
        )
        assert template_with_filters.filters == filters

    def test_export_template_all_formats(self):
        """ExportTemplate should accept all defined formats."""
        columns = ["name"]

        for format_enum in [ExportFormat.PDF, ExportFormat.XLSX, ExportFormat.CSV, ExportFormat.JSON]:
            template = ExportTemplate(
                name=f"Test {format_enum}",
                format=format_enum,
                columns=columns,
                tenant_id="tenant-123",
                created_by="user-123"
            )
            assert template.format == format_enum

    def test_export_template_create_pattern(self):
        """ExportTemplateCreate should follow create model pattern."""
        columns = ["name", "phone"]
        filters = {"status": "contactado"}

        template_create = ExportTemplateCreate(
            name="Monthly Report",
            format=ExportFormat.XLSX,
            columns=columns,
            filters=filters
        )

        assert template_create.name == "Monthly Report"
        assert template_create.format == ExportFormat.XLSX
        assert template_create.columns == columns
        assert template_create.filters == filters
