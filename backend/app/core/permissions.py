PERMISSIONS = [
    # =========================
    # Employees
    # =========================
    {
        "code": "EMPLOYEE_VIEW",
        "name": "View Employees",
        "description": "Allows viewing employee information.",
        "module": "EMPLOYEE",
    },
    {
        "code": "EMPLOYEE_CREATE",
        "name": "Create Employees",
        "description": "Allows creating new employee records.",
        "module": "EMPLOYEE",
    },
    {
        "code": "EMPLOYEE_UPDATE",
        "name": "Update Employees",
        "description": "Allows updating employee information.",
        "module": "EMPLOYEE",
    },
    {
        "code": "EMPLOYEE_DELETE",
        "name": "Delete Employees",
        "description": "Allows deleting employee records.",
        "module": "EMPLOYEE",
    },
    # =========================
    # Attendance
    # =========================
    {
        "code": "ATTENDANCE_VIEW",
        "name": "View Attendance",
        "description": "Allows viewing attendance records.",
        "module": "ATTENDANCE",
    },
    {
        "code": "ATTENDANCE_CREATE",
        "name": "Create Attendance",
        "description": "Allows creating attendance records.",
        "module": "ATTENDANCE",
    },
    {
        "code": "ATTENDANCE_UPDATE",
        "name": "Update Attendance",
        "description": "Allows modifying attendance records.",
        "module": "ATTENDANCE",
    },
    {
        "code": "ATTENDANCE_APPROVE",
        "name": "Approve Attendance",
        "description": "Allows approving attendance changes or corrections.",
        "module": "ATTENDANCE",
    },
    # =========================
    # Leave
    # =========================
    {
        "code": "LEAVE_VIEW",
        "name": "View Leave",
        "description": "Allows viewing leave records.",
        "module": "LEAVE",
    },
    {
        "code": "LEAVE_CREATE",
        "name": "Create Leave",
        "description": "Allows creating leave requests.",
        "module": "LEAVE",
    },
    {
        "code": "LEAVE_UPDATE",
        "name": "Update Leave",
        "description": "Allows modifying leave records.",
        "module": "LEAVE",
    },
    {
        "code": "LEAVE_APPROVE",
        "name": "Approve Leave",
        "description": "Allows approving or rejecting leave requests.",
        "module": "LEAVE",
    },
    # =========================
    # Tasks
    # =========================
    {
        "code": "TASK_VIEW",
        "name": "View Tasks",
        "description": "Allows viewing tasks.",
        "module": "TASK",
    },
    {
        "code": "TASK_CREATE",
        "name": "Create Tasks",
        "description": "Allows creating new tasks.",
        "module": "TASK",
    },
    {
        "code": "TASK_UPDATE",
        "name": "Update Tasks",
        "description": "Allows modifying tasks.",
        "module": "TASK",
    },
    {
        "code": "TASK_DELETE",
        "name": "Delete Tasks",
        "description": "Allows deleting tasks.",
        "module": "TASK",
    },
    # =========================
    # Tickets
    # =========================
    {
        "code": "TICKET_VIEW",
        "name": "View Tickets",
        "description": "Allows viewing tickets.",
        "module": "TICKET",
    },
    {
        "code": "TICKET_CREATE",
        "name": "Create Tickets",
        "description": "Allows creating new tickets.",
        "module": "TICKET",
    },
    {
        "code": "TICKET_UPDATE",
        "name": "Update Tickets",
        "description": "Allows modifying tickets.",
        "module": "TICKET",
    },
    {
        "code": "TICKET_DELETE",
        "name": "Delete Tickets",
        "description": "Allows deleting tickets.",
        "module": "TICKET",
    },
    # =========================
    # Reports
    # =========================
    {
        "code": "REPORT_VIEW",
        "name": "View Reports",
        "description": "Allows viewing reports.",
        "module": "REPORT",
    },
    {
        "code": "REPORT_EXPORT",
        "name": "Export Reports",
        "description": "Allows exporting reports.",
        "module": "REPORT",
    },
    # =========================
    # Payroll
    # =========================
    {
        "code": "PAYROLL_VIEW",
        "name": "View Payroll",
        "description": "Allows viewing payroll information.",
        "module": "PAYROLL",
    },
    {
        "code": "PAYROLL_PROCESS",
        "name": "Process Payroll",
        "description": "Allows processing payroll runs.",
        "module": "PAYROLL",
    },
    {
        "code": "PAYSLIP_VIEW",
        "name": "View Payslips",
        "description": "Allows viewing employee payslips.",
        "module": "PAYROLL",
    },
    # =========================
    # Assets
    # =========================
    {
        "code": "ASSET_VIEW",
        "name": "View Assets",
        "description": "Allows viewing company assets.",
        "module": "ASSET",
    },
    {
        "code": "ASSET_CREATE",
        "name": "Create Assets",
        "description": "Allows creating company assets.",
        "module": "ASSET",
    },
    {
        "code": "ASSET_UPDATE",
        "name": "Update Assets",
        "description": "Allows updating asset information.",
        "module": "ASSET",
    },
    {
        "code": "ASSET_DELETE",
        "name": "Delete Assets",
        "description": "Allows deleting company assets.",
        "module": "ASSET",
    },
    {
        "code": "ASSET_ASSIGN",
        "name": "Assign Assets",
        "description": "Allows assigning assets to employees.",
        "module": "ASSET",
    },
    # =========================
    # Company
    # =========================
    {
        "code": "COMPANY_VIEW",
        "name": "View Company",
        "description": "Allows viewing company information.",
        "module": "COMPANY",
    },
    {
        "code": "COMPANY_UPDATE",
        "name": "Update Company",
        "description": "Allows updating company information.",
        "module": "COMPANY",
    },
    # =========================
    # Company Branding
    # =========================
    {
        "code": "COMPANY_BRANDING_VIEW",
        "name": "View Company Branding",
        "description": "Allows viewing company branding settings.",
        "module": "COMPANY_BRANDING",
    },
    {
        "code": "COMPANY_BRANDING_UPDATE",
        "name": "Update Company Branding",
        "description": "Allows updating company branding settings.",
        "module": "COMPANY_BRANDING",
    },
    # =========================
    # Organization
    # =========================
    {
        "code": "ORGANIZATION_VIEW",
        "name": "View Organization Settings",
        "description": "Allows viewing company organization settings.",
        "module": "ORGANIZATION",
    },
    {
        "code": "ORGANIZATION_UPDATE",
        "name": "Update Organization Settings",
        "description": "Allows updating company organization settings.",
        "module": "ORGANIZATION",
    },
    # =========================
    # Workforce
    # =========================
    {
        "code": "WORKFORCE_VIEW",
        "name": "View Workforce Settings",
        "description": "Allows viewing workforce configuration.",
        "module": "WORKFORCE",
    },
    {
        "code": "WORKFORCE_UPDATE",
        "name": "Update Workforce Settings",
        "description": "Allows updating workforce configuration.",
        "module": "WORKFORCE",
    },
    # =========================
    # Roles & Permissions
    # =========================
    {
        "code": "ROLE_VIEW",
        "name": "View Roles",
        "description": "Allows viewing company roles and permissions.",
        "module": "ROLE",
    },
    {
        "code": "ROLE_CREATE",
        "name": "Create Roles",
        "description": "Allows creating company roles.",
        "module": "ROLE",
    },
    {
        "code": "ROLE_UPDATE",
        "name": "Update Roles",
        "description": "Allows updating company roles and permissions.",
        "module": "ROLE",
    },
    {
        "code": "ROLE_DELETE",
        "name": "Delete Roles",
        "description": "Allows deleting company roles.",
        "module": "ROLE",
    },
    {
        "code": "ROLE_ASSIGN",
        "name": "Assign Roles",
        "description": "Allows assigning roles to company members.",
        "module": "ROLE",
    },
]
