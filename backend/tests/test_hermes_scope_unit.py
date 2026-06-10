from hermes_crud_extensions import apply_role_scope_visibility


def test_broker_scope_filters_leads_by_assignment_or_creator():
    query = apply_role_scope_visibility(
        {"tenant_id": "tenant-1", "deleted": {"$ne": True}},
        "lead",
        "broker-1",
        "broker",
    )
    assert query["tenant_id"] == "tenant-1"
    assert {"assigned_broker_id": "broker-1"} in query["$or"]
    assert {"created_by": "broker-1"} in query["$or"]


def test_broker_scope_without_user_denies_records():
    query = apply_role_scope_visibility(
        {"tenant_id": "tenant-1"},
        "lead",
        None,
        "broker",
    )
    assert "$and" in query
    assert {"__rovi_scope_denied__": "__never__"} in query["$and"]


def test_broker_scope_preserves_existing_or_with_and_wrapper():
    query = apply_role_scope_visibility(
        {
            "tenant_id": "tenant-1",
            "$or": [{"name": {"$regex": "juan", "$options": "i"}}],
        },
        "lead",
        "broker-1",
        "broker",
    )
    assert "$and" in query
    assert query["$and"][0]["tenant_id"] == "tenant-1"
    assert {"assigned_broker_id": "broker-1"} in query["$and"][1]["$or"]


def test_agency_admin_keeps_tenant_query_without_user_filter():
    original = {"tenant_id": "tenant-1", "deleted": {"$ne": True}}
    query = apply_role_scope_visibility(original, "lead", "admin-1", "agency_admin")
    assert query == original


def test_orchestrator_does_not_remove_existing_tenant_guard():
    original = {"tenant_id": "tenant-1", "deleted": {"$ne": True}}
    query = apply_role_scope_visibility(original, "lead", "admin-1", "rovi_orchestrator")
    assert query == original

