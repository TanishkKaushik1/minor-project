import ResourcePanel from "./ResourcePanel";
import { listAuditLogs } from "../../api/admin";

// ponytail: shows only the newest 50 entries (page 1). Upgrade: add page controls once the log outgrows it.
export default function LogsPage() {
    return (
        <ResourcePanel
            title="Audit Log"
            list={() => listAuditLogs().then((r) => r.items)}
            columns={[
                "timestamp",
                "changed_by_name",
                "changed_by_email",
                "attendance_record_id",
                "old_status",
                "new_status",
                "reason",
            ]}
        />
    );
}