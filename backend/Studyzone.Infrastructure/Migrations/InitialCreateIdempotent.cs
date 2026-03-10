using Microsoft.EntityFrameworkCore.Migrations;

namespace Studyzone.Infrastructure.Migrations
{
    /// <summary>
    /// Idempotent SQL for InitialCreate: CREATE TABLE IF NOT EXISTS and add missing columns when table exists.
    /// </summary>
    internal static class InitialCreateIdempotent
    {
        public static void RunUp(MigrationBuilder mb)
        {
            CreateTablesIfNotExists(mb);
            EnsureAllColumns(mb);
            CreateIndexesIfNotExists(mb);
            CreateForeignKeysIfNotExists(mb);
        }

        public static void RunDown(MigrationBuilder mb)
        {
            DropTablesIfExists(mb);
        }

        private static void CreateTablesIfNotExists(MigrationBuilder mb)
        {
            mb.Sql(@"
CREATE TABLE IF NOT EXISTS ""AcademicYears"" (
    ""Id"" uuid NOT NULL,
    ""Name"" text NOT NULL,
    ""StartDate"" timestamp with time zone NOT NULL,
    ""EndDate"" timestamp with time zone NOT NULL,
    ""IsCurrent"" boolean NOT NULL,
    ""IsArchived"" boolean NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_AcademicYears"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""AdmissionApprovals"" (
    ""Id"" uuid NOT NULL,
    ""ApplicationId"" uuid NOT NULL,
    ""Status"" text NOT NULL,
    ""Reason"" text NULL,
    ""ApprovedByUserId"" uuid NULL,
    ""ApprovedAt"" timestamp with time zone NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_AdmissionApprovals"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""AdmissionNumberSequences"" (
    ""Id"" uuid NOT NULL,
    ""AcademicYearName"" text NOT NULL,
    ""ClassCode"" text NOT NULL,
    ""LastNumber"" integer NOT NULL,
    CONSTRAINT ""PK_AdmissionNumberSequences"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Announcements"" (
    ""Id"" uuid NOT NULL,
    ""Title"" text NOT NULL,
    ""Body"" text NOT NULL,
    ""AudienceType"" text NOT NULL,
    ""TargetId"" uuid NULL,
    ""CreatedByUserId"" uuid NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Announcements"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Applications"" (
    ""Id"" uuid NOT NULL,
    ""EnquiryId"" uuid NULL,
    ""Status"" text NOT NULL,
    ""AdmissionNumber"" text NULL,
    ""ClassId"" uuid NULL,
    ""BatchId"" uuid NULL,
    ""Batch"" text NULL,
    ""Section"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NULL,
    ""AcademicYear"" text NULL,
    ""StudentName"" text NOT NULL,
    ""Gender"" text NULL,
    ""PlaceOfBirth"" text NULL,
    ""DateOfBirth"" timestamp with time zone NULL,
    ""Nationality"" text NULL,
    ""Religion"" text NULL,
    ""PreviousSchool"" text NULL,
    ""PreviousClass"" text NULL,
    ""EmirateIfInsideUae"" text NULL,
    ""ClassApplied"" text NULL,
    ""CountryIfOutsideUae"" text NULL,
    ""SyllabusPreviousSchool"" text NULL,
    ""SecondLangPreviousSchool"" text NULL,
    ""DateOfLastAttendance"" timestamp with time zone NULL,
    ""PassportNo"" text NULL,
    ""PassportPlaceOfIssue"" text NULL,
    ""PassportDateOfIssue"" timestamp with time zone NULL,
    ""PassportDateOfExpiry"" timestamp with time zone NULL,
    ""ResidenceVisaNo"" text NULL,
    ""ResidenceVisaPlaceOfIssue"" text NULL,
    ""ResidenceVisaDateOfIssue"" timestamp with time zone NULL,
    ""ResidenceVisaDateOfExpiry"" timestamp with time zone NULL,
    ""EmiratesIdNo"" text NULL,
    ""EmiratesIdDateOfExpiry"" timestamp with time zone NULL,
    ""AnySpecialNeeds"" boolean NULL,
    ""SpecialNeedsDetails"" text NULL,
    ""PassportPhotoUrl"" text NULL,
    ""SisNo"" text NULL,
    ""RegNo"" text NULL,
    ""CheckedBy"" text NULL,
    ""OfficeSignature"" text NULL,
    ""Principal"" text NULL,
    ""ExtraCurricularSportsJson"" text NULL,
    ""ExtraCurricularActivitiesJson"" text NULL,
    ""FatherNameAsInPassport"" text NULL,
    ""FatherReligion"" text NULL,
    ""FatherNationality"" text NULL,
    ""FatherQualification"" text NULL,
    ""FatherMobileNumber"" text NULL,
    ""FatherEmailAddress"" text NULL,
    ""FatherOccupation"" text NULL,
    ""FatherCompanyName"" text NULL,
    ""FatherDesignation"" text NULL,
    ""FatherPoBoxEmirate"" text NULL,
    ""FatherOfficeTelephone"" text NULL,
    ""FatherEmiratesIdNumber"" text NULL,
    ""FatherAddressOfResidence"" text NULL,
    ""FatherAddressInHomeCountry"" text NULL,
    ""MotherNameAsInPassport"" text NULL,
    ""MotherReligion"" text NULL,
    ""MotherNationality"" text NULL,
    ""MotherQualification"" text NULL,
    ""MotherMobileNumber"" text NULL,
    ""MotherEmailAddress"" text NULL,
    ""MotherOccupation"" text NULL,
    ""MotherCompanyName"" text NULL,
    ""MotherDesignation"" text NULL,
    ""MotherPoBoxEmirate"" text NULL,
    ""MotherOfficeTelephone"" text NULL,
    ""MotherEmiratesIdNumber"" text NULL,
    ""MotherAddressOfResidence"" text NULL,
    ""MotherAddressInHomeCountry"" text NULL,
    ""OtherChildrenInSchoolJson"" text NULL,
    ""DeclarationParentNameAndSignature"" text NULL,
    ""DeclarationDate"" timestamp with time zone NULL,
    ""GuardianName"" text NULL,
    ""GuardianPhone"" text NULL,
    ""GuardianEmail"" text NULL,
    ""SubjectsRequired"" text NULL,
    ""InterviewDate"" timestamp with time zone NULL,
    ""InterviewNotes"" text NULL,
    CONSTRAINT ""PK_Applications"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""AttendanceRecords"" (
    ""Id"" uuid NOT NULL,
    ""StudentId"" uuid NULL,
    ""TeacherUserId"" uuid NULL,
    ""Date"" timestamp with time zone NOT NULL,
    ""PeriodNumber"" integer NULL,
    ""Status"" text NOT NULL,
    ""RecordType"" text NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_AttendanceRecords"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""AuditLogs"" (
    ""Id"" uuid NOT NULL,
    ""UserId"" uuid NULL,
    ""UserName"" text NULL,
    ""TableName"" text NOT NULL,
    ""Action"" text NOT NULL,
    ""EntityId"" text NULL,
    ""Timestamp"" timestamp with time zone NOT NULL,
    ""Details"" text NULL,
    CONSTRAINT ""PK_AuditLogs"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Classes"" (
    ""Id"" uuid NOT NULL,
    ""Name"" text NOT NULL,
    ""Code"" text NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Classes"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""CustomFieldDefinitions"" (
    ""Id"" uuid NOT NULL,
    ""EntityType"" text NOT NULL,
    ""FieldName"" text NOT NULL,
    ""FieldType"" text NOT NULL,
    ""IsRequired"" boolean NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_CustomFieldDefinitions"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Documents"" (
    ""Id"" uuid NOT NULL,
    ""ApplicationId"" uuid NULL,
    ""EnquiryId"" uuid NULL,
    ""DocumentType"" text NOT NULL,
    ""FilePath"" text NOT NULL,
    ""FileName"" text NOT NULL,
    ""FileSize"" bigint NOT NULL,
    ""ContentType"" text NOT NULL,
    ""UploadedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Documents"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Enquiries"" (
    ""Id"" uuid NOT NULL,
    ""StudentName"" text NOT NULL,
    ""GuardianName"" text NULL,
    ""Phone"" text NULL,
    ""Email"" text NULL,
    ""ClassOfInterest"" text NULL,
    ""Source"" text NULL,
    ""Status"" text NOT NULL,
    ""FollowUpDate"" timestamp with time zone NULL,
    ""Notes"" text NULL,
    ""AssignedToUserId"" uuid NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NULL,
    CONSTRAINT ""PK_Enquiries"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Exams"" (
    ""Id"" uuid NOT NULL,
    ""Name"" text NOT NULL,
    ""Type"" text NOT NULL,
    ""ClassId"" uuid NULL,
    ""ExamDate"" timestamp with time zone NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Exams"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""FeeCharges"" (
    ""Id"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""FeeStructureId"" uuid NOT NULL,
    ""Period"" text NOT NULL,
    ""Amount"" numeric NOT NULL,
    ""Description"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_FeeCharges"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""LeaveRequests"" (
    ""Id"" uuid NOT NULL,
    ""TeacherUserId"" uuid NOT NULL,
    ""FromDate"" timestamp with time zone NOT NULL,
    ""ToDate"" timestamp with time zone NOT NULL,
    ""LeaveType"" text NOT NULL,
    ""Reason"" text NULL,
    ""Status"" text NOT NULL,
    ""ApprovedByUserId"" uuid NULL,
    ""ApprovedAt"" timestamp with time zone NULL,
    ""RejectionReason"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_LeaveRequests"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""MarksEntries"" (
    ""Id"" uuid NOT NULL,
    ""ExamId"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""Subject"" text NOT NULL,
    ""MarksObtained"" numeric NOT NULL,
    ""MaxMarks"" numeric NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_MarksEntries"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Notifications"" (
    ""Id"" uuid NOT NULL,
    ""UserId"" uuid NOT NULL,
    ""Type"" text NOT NULL,
    ""Title"" text NOT NULL,
    ""RelatedEntityId"" uuid NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Notifications"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Payments"" (
    ""Id"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""Amount"" numeric NOT NULL,
    ""Mode"" text NOT NULL,
    ""ReceiptNumber"" text NOT NULL,
    ""PaidAt"" timestamp with time zone NOT NULL,
    ""Reference"" text NULL,
    ""Remarks"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Payments"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""PeriodConfigs"" (
    ""Id"" uuid NOT NULL,
    ""DayOfWeek"" integer NOT NULL,
    ""PeriodOrder"" integer NOT NULL,
    ""StartTime"" interval NOT NULL,
    ""EndTime"" interval NOT NULL,
    ""IsBreak"" boolean NOT NULL,
    ""Label"" text NULL,
    CONSTRAINT ""PK_PeriodConfigs"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""PortalRequests"" (
    ""Id"" uuid NOT NULL,
    ""UserId"" uuid NOT NULL,
    ""Role"" text NOT NULL,
    ""RequestType"" text NOT NULL,
    ""Subject"" text NOT NULL,
    ""Message"" text NOT NULL,
    ""Status"" text NOT NULL,
    ""AdminComment"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NULL,
    CONSTRAINT ""PK_PortalRequests"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""ReceiptSequences"" (
    ""Id"" uuid NOT NULL,
    ""Prefix"" text NOT NULL,
    ""LastNumber"" integer NOT NULL,
    CONSTRAINT ""PK_ReceiptSequences"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Roles"" (
    ""Id"" uuid NOT NULL,
    ""Name"" text NOT NULL,
    ""Description"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Roles"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""SchoolExpenses"" (
    ""Id"" uuid NOT NULL,
    ""Date"" timestamp with time zone NOT NULL,
    ""Category"" text NOT NULL,
    ""Description"" text NOT NULL,
    ""Amount"" numeric NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""CreatedByUserId"" uuid NULL,
    CONSTRAINT ""PK_SchoolExpenses"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Schools"" (
    ""Id"" uuid NOT NULL,
    ""Name"" text NOT NULL,
    ""Address"" text NULL,
    ""LogoUrl"" text NULL,
    ""Phone"" text NULL,
    ""Email"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NULL,
    CONSTRAINT ""PK_Schools"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""SiblingGroups"" (
    ""Id"" uuid NOT NULL,
    ""Name"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_SiblingGroups"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""StudentParents"" (
    ""Id"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""ParentUserId"" uuid NOT NULL,
    ""IsPrimary"" boolean NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_StudentParents"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Students"" (
    ""Id"" uuid NOT NULL,
    ""AdmissionNumber"" text NOT NULL,
    ""UserId"" uuid NULL,
    ""Name"" text NOT NULL,
    ""DateOfBirth"" timestamp with time zone NULL,
    ""Gender"" text NULL,
    ""GuardianName"" text NULL,
    ""GuardianPhone"" text NULL,
    ""GuardianEmail"" text NULL,
    ""Address"" text NULL,
    ""JoinedAt"" timestamp with time zone NULL,
    ""LeftAt"" timestamp with time zone NULL,
    ""SiblingGroupId"" uuid NULL,
    ""CustomFieldsJson"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NULL,
    CONSTRAINT ""PK_Students"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""StudentStatusHistories"" (
    ""Id"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""Status"" text NOT NULL,
    ""EffectiveDate"" timestamp with time zone NOT NULL,
    ""Notes"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_StudentStatusHistories"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Subjects"" (
    ""Id"" uuid NOT NULL,
    ""Name"" text NOT NULL,
    ""Code"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Subjects"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Substitutions"" (
    ""Id"" uuid NOT NULL,
    ""TimetableSlotId"" uuid NOT NULL,
    ""ForDate"" timestamp with time zone NOT NULL,
    ""SubstituteTeacherUserId"" uuid NOT NULL,
    ""Notes"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Substitutions"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""TeacherSalaries"" (
    ""Id"" uuid NOT NULL,
    ""TeacherUserId"" uuid NOT NULL,
    ""EffectiveFrom"" timestamp with time zone NOT NULL,
    ""EffectiveTo"" timestamp with time zone NULL,
    ""Amount"" numeric NOT NULL,
    ""PayFrequency"" text NOT NULL,
    ""Currency"" text NOT NULL,
    ""Notes"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NULL,
    CONSTRAINT ""PK_TeacherSalaries"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""TeacherSalaryPayments"" (
    ""Id"" uuid NOT NULL,
    ""TeacherUserId"" uuid NOT NULL,
    ""Year"" integer NOT NULL,
    ""Month"" integer NOT NULL,
    ""BaseAmount"" numeric NOT NULL,
    ""Status"" text NOT NULL,
    ""PaidAt"" timestamp with time zone NULL,
    ""Notes"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NULL,
    CONSTRAINT ""PK_TeacherSalaryPayments"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""TimetableSettings"" (
    ""Id"" uuid NOT NULL,
    ""WorkingDayCount"" integer NOT NULL,
    ""PeriodsPerDay"" integer NOT NULL,
    CONSTRAINT ""PK_TimetableSettings"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""TimetableSlots"" (
    ""Id"" uuid NOT NULL,
    ""BatchId"" uuid NOT NULL,
    ""DayOfWeek"" integer NOT NULL,
    ""PeriodOrder"" integer NOT NULL,
    ""Subject"" text NOT NULL,
    ""Room"" text NULL,
    ""TeacherUserId"" uuid NULL,
    ""TeacherName"" text NULL,
    ""IsPublished"" boolean NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_TimetableSlots"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Users"" (
    ""Id"" uuid NOT NULL,
    ""UserId"" text NOT NULL,
    ""PasswordHash"" text NOT NULL,
    ""Name"" text NOT NULL,
    ""Role"" text NOT NULL,
    ""IsActive"" boolean NOT NULL,
    ""Phone"" text NULL,
    ""Email"" text NULL,
    ""Subject"" text NULL,
    ""ClassesAssigned"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NULL,
    CONSTRAINT ""PK_Users"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""FeeStructures"" (
    ""Id"" uuid NOT NULL,
    ""ClassId"" uuid NOT NULL,
    ""AcademicYearId"" uuid NOT NULL,
    ""Name"" text NOT NULL,
    ""Amount"" numeric NOT NULL,
    ""Frequency"" text NOT NULL,
    ""EffectiveFrom"" timestamp with time zone NOT NULL,
    ""EffectiveTo"" timestamp with time zone NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_FeeStructures"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""Batches"" (
    ""Id"" uuid NOT NULL,
    ""ClassId"" uuid NOT NULL,
    ""AcademicYearId"" uuid NOT NULL,
    ""Name"" text NOT NULL,
    ""Section"" text NULL,
    ""SeatLimit"" integer NULL,
    ""ClassTeacherUserId"" uuid NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_Batches"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""RolePermissions"" (
    ""Id"" uuid NOT NULL,
    ""RoleId"" uuid NOT NULL,
    ""PermissionKey"" text NOT NULL,
    CONSTRAINT ""PK_RolePermissions"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""StudentEnrollments"" (
    ""Id"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""AcademicYearId"" uuid NOT NULL,
    ""ClassId"" uuid NULL,
    ""BatchId"" uuid NULL,
    ""Section"" text NULL,
    ""Status"" text NOT NULL,
    ""AdmissionNumber"" text NOT NULL,
    ""JoinedAt"" timestamp with time zone NULL,
    ""LeftAt"" timestamp with time zone NULL,
    ""FeePaymentStartMonth"" integer NULL,
    ""FeePaymentStartYear"" integer NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_StudentEnrollments"" PRIMARY KEY (""Id"")
);

CREATE TABLE IF NOT EXISTS ""ClassSubjects"" (
    ""ClassId"" uuid NOT NULL,
    ""SubjectId"" uuid NOT NULL,
    CONSTRAINT ""PK_ClassSubjects"" PRIMARY KEY (""ClassId"", ""SubjectId"")
);

CREATE TABLE IF NOT EXISTS ""TeacherSalaryPaymentLines"" (
    ""Id"" uuid NOT NULL,
    ""TeacherSalaryPaymentId"" uuid NOT NULL,
    ""LineType"" text NOT NULL,
    ""Description"" text NOT NULL,
    ""Amount"" numeric NOT NULL,
    CONSTRAINT ""PK_TeacherSalaryPaymentLines"" PRIMARY KEY (""Id"")
);
");

        }

        private static void EnsureAllColumns(MigrationBuilder mb)
        {
            // For each table: if column does not exist, add it. Use DO blocks.
            // NOT NULL columns need DEFAULT when adding to existing rows.
            AddColumnIfNotExists(mb, "AcademicYears", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "AcademicYears", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "AcademicYears", "StartDate", "timestamp with time zone", false, "'1970-01-01 00:00:00+00'::timestamp with time zone");
            AddColumnIfNotExists(mb, "AcademicYears", "EndDate", "timestamp with time zone", false, "'1970-01-01 00:00:00+00'::timestamp with time zone");
            AddColumnIfNotExists(mb, "AcademicYears", "IsCurrent", "boolean", false, "false");
            AddColumnIfNotExists(mb, "AcademicYears", "IsArchived", "boolean", false, "false");
            AddColumnIfNotExists(mb, "AcademicYears", "CreatedAt", "timestamp with time zone", false, "now()");

            EnsureColumnsApplications(mb);
            EnsureColumnsAttendanceRecords(mb);
            EnsureColumnsAuditLogs(mb);
            EnsureColumnsBatches(mb);
            EnsureColumnsClassSubjects(mb);
            EnsureColumnsClasses(mb);
            EnsureColumnsCustomFieldDefinitions(mb);
            EnsureColumnsDocuments(mb);
            EnsureColumnsEnquiries(mb);
            EnsureColumnsExams(mb);
            EnsureColumnsFeeCharges(mb);
            EnsureColumnsFeeStructures(mb);
            EnsureColumnsLeaveRequests(mb);
            EnsureColumnsMarksEntries(mb);
            EnsureColumnsNotifications(mb);
            EnsureColumnsPayments(mb);
            EnsureColumnsPeriodConfigs(mb);
            EnsureColumnsPortalRequests(mb);
            EnsureColumnsReceiptSequences(mb);
            EnsureColumnsRolePermissions(mb);
            EnsureColumnsRoles(mb);
            EnsureColumnsSchoolExpenses(mb);
            EnsureColumnsSchools(mb);
            EnsureColumnsSiblingGroups(mb);
            EnsureColumnsStudentEnrollments(mb);
            EnsureColumnsStudentParents(mb);
            EnsureColumnsStudents(mb);
            EnsureColumnsStudentStatusHistories(mb);
            EnsureColumnsSubjects(mb);
            EnsureColumnsSubstitutions(mb);
            EnsureColumnsTeacherSalaries(mb);
            EnsureColumnsTeacherSalaryPaymentLines(mb);
            EnsureColumnsTeacherSalaryPayments(mb);
            EnsureColumnsTimetableSettings(mb);
            EnsureColumnsTimetableSlots(mb);
            EnsureColumnsUsers(mb);
            EnsureColumnsAdmissionApprovals(mb);
            EnsureColumnsAdmissionNumberSequences(mb);
            EnsureColumnsAnnouncements(mb);
        }

        private static void AddColumnIfNotExists(MigrationBuilder mb, string table, string column, string pgType, bool nullable, string notNullDefault)
        {
            var nullClause = nullable ? " NULL" : " NOT NULL DEFAULT " + (notNullDefault ?? "NULL");
            string Esc(string s) => s?.Replace("'", "''") ?? "";
            var pgTypeEsc = Esc(pgType);
            var nullClauseEsc = Esc(nullClause);
            mb.Sql($@"
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '{table}')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '{table}' AND column_name = '{column}')
    THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s %s', '{table}', '{column}', '{pgTypeEsc}', '{nullClauseEsc}');
    END IF;
END $$;");
        }

        private static void EnsureColumnsApplications(MigrationBuilder mb)
        {
            var cols = new[] {
                ("Id", "uuid", false, "gen_random_uuid()"), ("EnquiryId", "uuid", true, null), ("Status", "text", false, "''"),
                ("AdmissionNumber", "text", true, null), ("ClassId", "uuid", true, null), ("BatchId", "uuid", true, null),
                ("Batch", "text", true, null), ("Section", "text", true, null), ("CreatedAt", "timestamp with time zone", false, "now()"),
                ("UpdatedAt", "timestamp with time zone", true, null), ("AcademicYear", "text", true, null), ("StudentName", "text", false, "''"),
                ("Gender", "text", true, null), ("PlaceOfBirth", "text", true, null), ("DateOfBirth", "timestamp with time zone", true, null),
                ("Nationality", "text", true, null), ("Religion", "text", true, null), ("PreviousSchool", "text", true, null),
                ("PreviousClass", "text", true, null), ("EmirateIfInsideUae", "text", true, null), ("ClassApplied", "text", true, null),
                ("CountryIfOutsideUae", "text", true, null), ("SyllabusPreviousSchool", "text", true, null), ("SecondLangPreviousSchool", "text", true, null),
                ("DateOfLastAttendance", "timestamp with time zone", true, null), ("PassportNo", "text", true, null), ("PassportPlaceOfIssue", "text", true, null),
                ("PassportDateOfIssue", "timestamp with time zone", true, null), ("PassportDateOfExpiry", "timestamp with time zone", true, null),
                ("ResidenceVisaNo", "text", true, null), ("ResidenceVisaPlaceOfIssue", "text", true, null), ("ResidenceVisaDateOfIssue", "timestamp with time zone", true, null),
                ("ResidenceVisaDateOfExpiry", "timestamp with time zone", true, null), ("EmiratesIdNo", "text", true, null), ("EmiratesIdDateOfExpiry", "timestamp with time zone", true, null),
                ("AnySpecialNeeds", "boolean", true, null), ("SpecialNeedsDetails", "text", true, null), ("PassportPhotoUrl", "text", true, null),
                ("SisNo", "text", true, null), ("RegNo", "text", true, null), ("CheckedBy", "text", true, null), ("OfficeSignature", "text", true, null),
                ("Principal", "text", true, null), ("ExtraCurricularSportsJson", "text", true, null), ("ExtraCurricularActivitiesJson", "text", true, null),
                ("FatherNameAsInPassport", "text", true, null), ("FatherReligion", "text", true, null), ("FatherNationality", "text", true, null),
                ("FatherQualification", "text", true, null), ("FatherMobileNumber", "text", true, null), ("FatherEmailAddress", "text", true, null),
                ("FatherOccupation", "text", true, null), ("FatherCompanyName", "text", true, null), ("FatherDesignation", "text", true, null),
                ("FatherPoBoxEmirate", "text", true, null), ("FatherOfficeTelephone", "text", true, null), ("FatherEmiratesIdNumber", "text", true, null),
                ("FatherAddressOfResidence", "text", true, null), ("FatherAddressInHomeCountry", "text", true, null),
                ("MotherNameAsInPassport", "text", true, null), ("MotherReligion", "text", true, null), ("MotherNationality", "text", true, null),
                ("MotherQualification", "text", true, null), ("MotherMobileNumber", "text", true, null), ("MotherEmailAddress", "text", true, null),
                ("MotherOccupation", "text", true, null), ("MotherCompanyName", "text", true, null), ("MotherDesignation", "text", true, null),
                ("MotherPoBoxEmirate", "text", true, null), ("MotherOfficeTelephone", "text", true, null), ("MotherEmiratesIdNumber", "text", true, null),
                ("MotherAddressOfResidence", "text", true, null), ("MotherAddressInHomeCountry", "text", true, null),
                ("OtherChildrenInSchoolJson", "text", true, null), ("DeclarationParentNameAndSignature", "text", true, null), ("DeclarationDate", "timestamp with time zone", true, null),
                ("GuardianName", "text", true, null), ("GuardianPhone", "text", true, null), ("GuardianEmail", "text", true, null),
                ("SubjectsRequired", "text", true, null), ("InterviewDate", "timestamp with time zone", true, null), ("InterviewNotes", "text", true, null)
            };
            foreach (var (col, typ, nul, def) in cols)
                AddColumnIfNotExists(mb, "Applications", col, typ, nul, def ?? "NULL");
        }

        private static void EnsureColumnsAttendanceRecords(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "AttendanceRecords", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "AttendanceRecords", "StudentId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "AttendanceRecords", "TeacherUserId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "AttendanceRecords", "Date", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "AttendanceRecords", "PeriodNumber", "integer", true, "NULL");
            AddColumnIfNotExists(mb, "AttendanceRecords", "Status", "text", false, "''");
            AddColumnIfNotExists(mb, "AttendanceRecords", "RecordType", "text", false, "''");
            AddColumnIfNotExists(mb, "AttendanceRecords", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsAuditLogs(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "AuditLogs", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "AuditLogs", "UserId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "AuditLogs", "UserName", "text", true, "NULL");
            AddColumnIfNotExists(mb, "AuditLogs", "TableName", "text", false, "''");
            AddColumnIfNotExists(mb, "AuditLogs", "Action", "text", false, "''");
            AddColumnIfNotExists(mb, "AuditLogs", "EntityId", "text", true, "NULL");
            AddColumnIfNotExists(mb, "AuditLogs", "Timestamp", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "AuditLogs", "Details", "text", true, "NULL");
        }

        private static void EnsureColumnsBatches(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Batches", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Batches", "ClassId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Batches", "AcademicYearId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Batches", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "Batches", "Section", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Batches", "SeatLimit", "integer", true, "NULL");
            AddColumnIfNotExists(mb, "Batches", "ClassTeacherUserId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Batches", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsClassSubjects(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "ClassSubjects", "ClassId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "ClassSubjects", "SubjectId", "uuid", false, "gen_random_uuid()");
        }

        private static void EnsureColumnsClasses(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Classes", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Classes", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "Classes", "Code", "text", false, "''");
            AddColumnIfNotExists(mb, "Classes", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsCustomFieldDefinitions(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "CustomFieldDefinitions", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "CustomFieldDefinitions", "EntityType", "text", false, "''");
            AddColumnIfNotExists(mb, "CustomFieldDefinitions", "FieldName", "text", false, "''");
            AddColumnIfNotExists(mb, "CustomFieldDefinitions", "FieldType", "text", false, "''");
            AddColumnIfNotExists(mb, "CustomFieldDefinitions", "IsRequired", "boolean", false, "false");
            AddColumnIfNotExists(mb, "CustomFieldDefinitions", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsDocuments(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Documents", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Documents", "ApplicationId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Documents", "EnquiryId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Documents", "DocumentType", "text", false, "''");
            AddColumnIfNotExists(mb, "Documents", "FilePath", "text", false, "''");
            AddColumnIfNotExists(mb, "Documents", "FileName", "text", false, "''");
            AddColumnIfNotExists(mb, "Documents", "FileSize", "bigint", false, "0");
            AddColumnIfNotExists(mb, "Documents", "ContentType", "text", false, "''");
            AddColumnIfNotExists(mb, "Documents", "UploadedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsEnquiries(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Enquiries", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Enquiries", "StudentName", "text", false, "''");
            AddColumnIfNotExists(mb, "Enquiries", "GuardianName", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Enquiries", "Phone", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Enquiries", "Email", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Enquiries", "ClassOfInterest", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Enquiries", "Source", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Enquiries", "Status", "text", false, "''");
            AddColumnIfNotExists(mb, "Enquiries", "FollowUpDate", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "Enquiries", "Notes", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Enquiries", "AssignedToUserId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Enquiries", "CreatedAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "Enquiries", "UpdatedAt", "timestamp with time zone", true, "NULL");
        }

        private static void EnsureColumnsExams(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Exams", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Exams", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "Exams", "Type", "text", false, "''");
            AddColumnIfNotExists(mb, "Exams", "ClassId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Exams", "ExamDate", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "Exams", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsFeeCharges(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "FeeCharges", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "FeeCharges", "StudentId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "FeeCharges", "FeeStructureId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "FeeCharges", "Period", "text", false, "''");
            AddColumnIfNotExists(mb, "FeeCharges", "Amount", "numeric", false, "0");
            AddColumnIfNotExists(mb, "FeeCharges", "Description", "text", true, "NULL");
            AddColumnIfNotExists(mb, "FeeCharges", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsFeeStructures(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "FeeStructures", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "FeeStructures", "ClassId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "FeeStructures", "AcademicYearId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "FeeStructures", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "FeeStructures", "Amount", "numeric", false, "0");
            AddColumnIfNotExists(mb, "FeeStructures", "Frequency", "text", false, "''");
            AddColumnIfNotExists(mb, "FeeStructures", "EffectiveFrom", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "FeeStructures", "EffectiveTo", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "FeeStructures", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsLeaveRequests(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "LeaveRequests", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "LeaveRequests", "TeacherUserId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "LeaveRequests", "FromDate", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "LeaveRequests", "ToDate", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "LeaveRequests", "LeaveType", "text", false, "''");
            AddColumnIfNotExists(mb, "LeaveRequests", "Reason", "text", true, "NULL");
            AddColumnIfNotExists(mb, "LeaveRequests", "Status", "text", false, "''");
            AddColumnIfNotExists(mb, "LeaveRequests", "ApprovedByUserId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "LeaveRequests", "ApprovedAt", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "LeaveRequests", "RejectionReason", "text", true, "NULL");
            AddColumnIfNotExists(mb, "LeaveRequests", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsMarksEntries(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "MarksEntries", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "MarksEntries", "ExamId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "MarksEntries", "StudentId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "MarksEntries", "Subject", "text", false, "''");
            AddColumnIfNotExists(mb, "MarksEntries", "MarksObtained", "numeric", false, "0");
            AddColumnIfNotExists(mb, "MarksEntries", "MaxMarks", "numeric", false, "0");
            AddColumnIfNotExists(mb, "MarksEntries", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsNotifications(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Notifications", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Notifications", "UserId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Notifications", "Type", "text", false, "''");
            AddColumnIfNotExists(mb, "Notifications", "Title", "text", false, "''");
            AddColumnIfNotExists(mb, "Notifications", "RelatedEntityId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Notifications", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsPayments(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Payments", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Payments", "StudentId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Payments", "Amount", "numeric", false, "0");
            AddColumnIfNotExists(mb, "Payments", "Mode", "text", false, "''");
            AddColumnIfNotExists(mb, "Payments", "ReceiptNumber", "text", false, "''");
            AddColumnIfNotExists(mb, "Payments", "PaidAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "Payments", "Reference", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Payments", "Remarks", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Payments", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsPeriodConfigs(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "PeriodConfigs", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "PeriodConfigs", "DayOfWeek", "integer", false, "0");
            AddColumnIfNotExists(mb, "PeriodConfigs", "PeriodOrder", "integer", false, "0");
            AddColumnIfNotExists(mb, "PeriodConfigs", "StartTime", "interval", false, "'0'::interval");
            AddColumnIfNotExists(mb, "PeriodConfigs", "EndTime", "interval", false, "'0'::interval");
            AddColumnIfNotExists(mb, "PeriodConfigs", "IsBreak", "boolean", false, "false");
            AddColumnIfNotExists(mb, "PeriodConfigs", "Label", "text", true, "NULL");
        }

        private static void EnsureColumnsPortalRequests(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "PortalRequests", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "PortalRequests", "UserId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "PortalRequests", "Role", "text", false, "''");
            AddColumnIfNotExists(mb, "PortalRequests", "RequestType", "text", false, "''");
            AddColumnIfNotExists(mb, "PortalRequests", "Subject", "text", false, "''");
            AddColumnIfNotExists(mb, "PortalRequests", "Message", "text", false, "''");
            AddColumnIfNotExists(mb, "PortalRequests", "Status", "text", false, "''");
            AddColumnIfNotExists(mb, "PortalRequests", "AdminComment", "text", true, "NULL");
            AddColumnIfNotExists(mb, "PortalRequests", "CreatedAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "PortalRequests", "UpdatedAt", "timestamp with time zone", true, "NULL");
        }

        private static void EnsureColumnsReceiptSequences(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "ReceiptSequences", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "ReceiptSequences", "Prefix", "text", false, "''");
            AddColumnIfNotExists(mb, "ReceiptSequences", "LastNumber", "integer", false, "0");
        }

        private static void EnsureColumnsRolePermissions(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "RolePermissions", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "RolePermissions", "RoleId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "RolePermissions", "PermissionKey", "text", false, "''");
        }

        private static void EnsureColumnsRoles(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Roles", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Roles", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "Roles", "Description", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Roles", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsSchoolExpenses(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "SchoolExpenses", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "SchoolExpenses", "Date", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "SchoolExpenses", "Category", "text", false, "''");
            AddColumnIfNotExists(mb, "SchoolExpenses", "Description", "text", false, "''");
            AddColumnIfNotExists(mb, "SchoolExpenses", "Amount", "numeric", false, "0");
            AddColumnIfNotExists(mb, "SchoolExpenses", "CreatedAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "SchoolExpenses", "CreatedByUserId", "uuid", true, "NULL");
        }

        private static void EnsureColumnsSchools(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Schools", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Schools", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "Schools", "Address", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Schools", "LogoUrl", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Schools", "Phone", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Schools", "Email", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Schools", "CreatedAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "Schools", "UpdatedAt", "timestamp with time zone", true, "NULL");
        }

        private static void EnsureColumnsSiblingGroups(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "SiblingGroups", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "SiblingGroups", "Name", "text", true, "NULL");
            AddColumnIfNotExists(mb, "SiblingGroups", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsStudentEnrollments(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "StudentEnrollments", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "StudentEnrollments", "StudentId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "StudentEnrollments", "AcademicYearId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "StudentEnrollments", "ClassId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "StudentEnrollments", "BatchId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "StudentEnrollments", "Section", "text", true, "NULL");
            AddColumnIfNotExists(mb, "StudentEnrollments", "Status", "text", false, "''");
            AddColumnIfNotExists(mb, "StudentEnrollments", "AdmissionNumber", "text", false, "''");
            AddColumnIfNotExists(mb, "StudentEnrollments", "JoinedAt", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "StudentEnrollments", "LeftAt", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "StudentEnrollments", "FeePaymentStartMonth", "integer", true, "NULL");
            AddColumnIfNotExists(mb, "StudentEnrollments", "FeePaymentStartYear", "integer", true, "NULL");
            AddColumnIfNotExists(mb, "StudentEnrollments", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsStudentParents(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "StudentParents", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "StudentParents", "StudentId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "StudentParents", "ParentUserId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "StudentParents", "IsPrimary", "boolean", false, "false");
            AddColumnIfNotExists(mb, "StudentParents", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsStudents(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Students", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Students", "AdmissionNumber", "text", false, "''");
            AddColumnIfNotExists(mb, "Students", "UserId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "Students", "DateOfBirth", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "Gender", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "GuardianName", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "GuardianPhone", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "GuardianEmail", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "Address", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "JoinedAt", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "LeftAt", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "SiblingGroupId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "CustomFieldsJson", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Students", "CreatedAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "Students", "UpdatedAt", "timestamp with time zone", true, "NULL");
        }

        private static void EnsureColumnsStudentStatusHistories(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "StudentStatusHistories", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "StudentStatusHistories", "StudentId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "StudentStatusHistories", "Status", "text", false, "''");
            AddColumnIfNotExists(mb, "StudentStatusHistories", "EffectiveDate", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "StudentStatusHistories", "Notes", "text", true, "NULL");
            AddColumnIfNotExists(mb, "StudentStatusHistories", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsSubjects(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Subjects", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Subjects", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "Subjects", "Code", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Subjects", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsSubstitutions(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Substitutions", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Substitutions", "TimetableSlotId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Substitutions", "ForDate", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "Substitutions", "SubstituteTeacherUserId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Substitutions", "Notes", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Substitutions", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsTeacherSalaries(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "TeacherSalaries", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TeacherSalaries", "TeacherUserId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TeacherSalaries", "EffectiveFrom", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "TeacherSalaries", "EffectiveTo", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "TeacherSalaries", "Amount", "numeric", false, "0");
            AddColumnIfNotExists(mb, "TeacherSalaries", "PayFrequency", "text", false, "''");
            AddColumnIfNotExists(mb, "TeacherSalaries", "Currency", "text", false, "''");
            AddColumnIfNotExists(mb, "TeacherSalaries", "Notes", "text", true, "NULL");
            AddColumnIfNotExists(mb, "TeacherSalaries", "CreatedAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "TeacherSalaries", "UpdatedAt", "timestamp with time zone", true, "NULL");
        }

        private static void EnsureColumnsTeacherSalaryPaymentLines(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "TeacherSalaryPaymentLines", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TeacherSalaryPaymentLines", "TeacherSalaryPaymentId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TeacherSalaryPaymentLines", "LineType", "text", false, "''");
            AddColumnIfNotExists(mb, "TeacherSalaryPaymentLines", "Description", "text", false, "''");
            AddColumnIfNotExists(mb, "TeacherSalaryPaymentLines", "Amount", "numeric", false, "0");
        }

        private static void EnsureColumnsTeacherSalaryPayments(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "TeacherUserId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "Year", "integer", false, "0");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "Month", "integer", false, "0");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "BaseAmount", "numeric", false, "0");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "Status", "text", false, "''");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "PaidAt", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "Notes", "text", true, "NULL");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "CreatedAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "TeacherSalaryPayments", "UpdatedAt", "timestamp with time zone", true, "NULL");
        }

        private static void EnsureColumnsTimetableSettings(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "TimetableSettings", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TimetableSettings", "WorkingDayCount", "integer", false, "0");
            AddColumnIfNotExists(mb, "TimetableSettings", "PeriodsPerDay", "integer", false, "0");
        }

        private static void EnsureColumnsTimetableSlots(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "TimetableSlots", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TimetableSlots", "BatchId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "TimetableSlots", "DayOfWeek", "integer", false, "0");
            AddColumnIfNotExists(mb, "TimetableSlots", "PeriodOrder", "integer", false, "0");
            AddColumnIfNotExists(mb, "TimetableSlots", "Subject", "text", false, "''");
            AddColumnIfNotExists(mb, "TimetableSlots", "Room", "text", true, "NULL");
            AddColumnIfNotExists(mb, "TimetableSlots", "TeacherUserId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "TimetableSlots", "TeacherName", "text", true, "NULL");
            AddColumnIfNotExists(mb, "TimetableSlots", "IsPublished", "boolean", false, "false");
            AddColumnIfNotExists(mb, "TimetableSlots", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsUsers(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Users", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Users", "UserId", "text", false, "''");
            AddColumnIfNotExists(mb, "Users", "PasswordHash", "text", false, "''");
            AddColumnIfNotExists(mb, "Users", "Name", "text", false, "''");
            AddColumnIfNotExists(mb, "Users", "Role", "text", false, "''");
            AddColumnIfNotExists(mb, "Users", "IsActive", "boolean", false, "false");
            AddColumnIfNotExists(mb, "Users", "Phone", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Users", "Email", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Users", "Subject", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Users", "ClassesAssigned", "text", true, "NULL");
            AddColumnIfNotExists(mb, "Users", "CreatedAt", "timestamp with time zone", false, "now()");
            AddColumnIfNotExists(mb, "Users", "UpdatedAt", "timestamp with time zone", true, "NULL");
        }

        private static void EnsureColumnsAdmissionApprovals(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "AdmissionApprovals", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "AdmissionApprovals", "ApplicationId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "AdmissionApprovals", "Status", "text", false, "''");
            AddColumnIfNotExists(mb, "AdmissionApprovals", "Reason", "text", true, "NULL");
            AddColumnIfNotExists(mb, "AdmissionApprovals", "ApprovedByUserId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "AdmissionApprovals", "ApprovedAt", "timestamp with time zone", true, "NULL");
            AddColumnIfNotExists(mb, "AdmissionApprovals", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void EnsureColumnsAdmissionNumberSequences(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "AdmissionNumberSequences", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "AdmissionNumberSequences", "AcademicYearName", "text", false, "''");
            AddColumnIfNotExists(mb, "AdmissionNumberSequences", "ClassCode", "text", false, "''");
            AddColumnIfNotExists(mb, "AdmissionNumberSequences", "LastNumber", "integer", false, "0");
        }

        private static void EnsureColumnsAnnouncements(MigrationBuilder mb)
        {
            AddColumnIfNotExists(mb, "Announcements", "Id", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Announcements", "Title", "text", false, "''");
            AddColumnIfNotExists(mb, "Announcements", "Body", "text", false, "''");
            AddColumnIfNotExists(mb, "Announcements", "AudienceType", "text", false, "''");
            AddColumnIfNotExists(mb, "Announcements", "TargetId", "uuid", true, "NULL");
            AddColumnIfNotExists(mb, "Announcements", "CreatedByUserId", "uuid", false, "gen_random_uuid()");
            AddColumnIfNotExists(mb, "Announcements", "CreatedAt", "timestamp with time zone", false, "now()");
        }

        private static void CreateIndexesIfNotExists(MigrationBuilder mb)
        {
            mb.Sql(@"
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_AdmissionNumberSequences_AcademicYearName_ClassCode"" ON ""AdmissionNumberSequences"" (""AcademicYearName"", ""ClassCode"");
CREATE INDEX IF NOT EXISTS ""IX_Announcements_AudienceType"" ON ""Announcements"" (""AudienceType"");
CREATE INDEX IF NOT EXISTS ""IX_Announcements_CreatedAt"" ON ""Announcements"" (""CreatedAt"");
CREATE INDEX IF NOT EXISTS ""IX_Applications_EnquiryId"" ON ""Applications"" (""EnquiryId"");
CREATE INDEX IF NOT EXISTS ""IX_Applications_Status"" ON ""Applications"" (""Status"");
CREATE INDEX IF NOT EXISTS ""IX_AttendanceRecords_Date"" ON ""AttendanceRecords"" (""Date"");
CREATE INDEX IF NOT EXISTS ""IX_AttendanceRecords_StudentId"" ON ""AttendanceRecords"" (""StudentId"");
CREATE INDEX IF NOT EXISTS ""IX_AttendanceRecords_StudentId_Date"" ON ""AttendanceRecords"" (""StudentId"", ""Date"");
CREATE INDEX IF NOT EXISTS ""IX_AuditLogs_TableName"" ON ""AuditLogs"" (""TableName"");
CREATE INDEX IF NOT EXISTS ""IX_AuditLogs_Timestamp"" ON ""AuditLogs"" (""Timestamp"");
CREATE INDEX IF NOT EXISTS ""IX_Batches_AcademicYearId"" ON ""Batches"" (""AcademicYearId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Batches_ClassId_AcademicYearId_Name"" ON ""Batches"" (""ClassId"", ""AcademicYearId"", ""Name"");
CREATE INDEX IF NOT EXISTS ""IX_ClassSubjects_SubjectId"" ON ""ClassSubjects"" (""SubjectId"");
CREATE INDEX IF NOT EXISTS ""IX_Documents_ApplicationId"" ON ""Documents"" (""ApplicationId"");
CREATE INDEX IF NOT EXISTS ""IX_Enquiries_FollowUpDate"" ON ""Enquiries"" (""FollowUpDate"");
CREATE INDEX IF NOT EXISTS ""IX_Enquiries_Status"" ON ""Enquiries"" (""Status"");
CREATE INDEX IF NOT EXISTS ""IX_FeeCharges_StudentId"" ON ""FeeCharges"" (""StudentId"");
CREATE INDEX IF NOT EXISTS ""IX_FeeCharges_StudentId_Period"" ON ""FeeCharges"" (""StudentId"", ""Period"");
CREATE INDEX IF NOT EXISTS ""IX_FeeStructures_AcademicYearId"" ON ""FeeStructures"" (""AcademicYearId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_FeeStructures_ClassId_AcademicYearId_Name"" ON ""FeeStructures"" (""ClassId"", ""AcademicYearId"", ""Name"");
CREATE INDEX IF NOT EXISTS ""IX_LeaveRequests_Status"" ON ""LeaveRequests"" (""Status"");
CREATE INDEX IF NOT EXISTS ""IX_LeaveRequests_TeacherUserId"" ON ""LeaveRequests"" (""TeacherUserId"");
CREATE INDEX IF NOT EXISTS ""IX_MarksEntries_ExamId"" ON ""MarksEntries"" (""ExamId"");
CREATE INDEX IF NOT EXISTS ""IX_MarksEntries_ExamId_StudentId_Subject"" ON ""MarksEntries"" (""ExamId"", ""StudentId"", ""Subject"");
CREATE INDEX IF NOT EXISTS ""IX_Notifications_CreatedAt"" ON ""Notifications"" (""CreatedAt"");
CREATE INDEX IF NOT EXISTS ""IX_Notifications_UserId"" ON ""Notifications"" (""UserId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Payments_ReceiptNumber"" ON ""Payments"" (""ReceiptNumber"");
CREATE INDEX IF NOT EXISTS ""IX_Payments_StudentId"" ON ""Payments"" (""StudentId"");
CREATE INDEX IF NOT EXISTS ""IX_PortalRequests_Role"" ON ""PortalRequests"" (""Role"");
CREATE INDEX IF NOT EXISTS ""IX_PortalRequests_Status"" ON ""PortalRequests"" (""Status"");
CREATE INDEX IF NOT EXISTS ""IX_PortalRequests_UserId"" ON ""PortalRequests"" (""UserId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ReceiptSequences_Prefix"" ON ""ReceiptSequences"" (""Prefix"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_RolePermissions_RoleId_PermissionKey"" ON ""RolePermissions"" (""RoleId"", ""PermissionKey"");
CREATE INDEX IF NOT EXISTS ""IX_SchoolExpenses_Category"" ON ""SchoolExpenses"" (""Category"");
CREATE INDEX IF NOT EXISTS ""IX_SchoolExpenses_Date"" ON ""SchoolExpenses"" (""Date"");
CREATE INDEX IF NOT EXISTS ""IX_StudentEnrollments_AcademicYearId"" ON ""StudentEnrollments"" (""AcademicYearId"");
CREATE INDEX IF NOT EXISTS ""IX_StudentEnrollments_BatchId"" ON ""StudentEnrollments"" (""BatchId"");
CREATE INDEX IF NOT EXISTS ""IX_StudentEnrollments_ClassId"" ON ""StudentEnrollments"" (""ClassId"");
CREATE INDEX IF NOT EXISTS ""IX_StudentEnrollments_Status"" ON ""StudentEnrollments"" (""Status"");
CREATE INDEX IF NOT EXISTS ""IX_StudentEnrollments_StudentId"" ON ""StudentEnrollments"" (""StudentId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_StudentEnrollments_StudentId_AcademicYearId"" ON ""StudentEnrollments"" (""StudentId"", ""AcademicYearId"");
CREATE INDEX IF NOT EXISTS ""IX_StudentParents_ParentUserId"" ON ""StudentParents"" (""ParentUserId"");
CREATE INDEX IF NOT EXISTS ""IX_StudentParents_StudentId"" ON ""StudentParents"" (""StudentId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_StudentParents_StudentId_ParentUserId"" ON ""StudentParents"" (""StudentId"", ""ParentUserId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Students_AdmissionNumber"" ON ""Students"" (""AdmissionNumber"");
CREATE INDEX IF NOT EXISTS ""IX_Subjects_Name"" ON ""Subjects"" (""Name"");
CREATE INDEX IF NOT EXISTS ""IX_TeacherSalaries_EffectiveFrom"" ON ""TeacherSalaries"" (""EffectiveFrom"");
CREATE INDEX IF NOT EXISTS ""IX_TeacherSalaries_TeacherUserId"" ON ""TeacherSalaries"" (""TeacherUserId"");
CREATE INDEX IF NOT EXISTS ""IX_TeacherSalaryPaymentLines_TeacherSalaryPaymentId"" ON ""TeacherSalaryPaymentLines"" (""TeacherSalaryPaymentId"");
CREATE INDEX IF NOT EXISTS ""IX_TeacherSalaryPayments_TeacherUserId"" ON ""TeacherSalaryPayments"" (""TeacherUserId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_TeacherSalaryPayments_TeacherUserId_Year_Month"" ON ""TeacherSalaryPayments"" (""TeacherUserId"", ""Year"", ""Month"");
CREATE INDEX IF NOT EXISTS ""IX_TeacherSalaryPayments_Year_Month"" ON ""TeacherSalaryPayments"" (""Year"", ""Month"");
CREATE INDEX IF NOT EXISTS ""IX_TimetableSlots_BatchId"" ON ""TimetableSlots"" (""BatchId"");
CREATE INDEX IF NOT EXISTS ""IX_TimetableSlots_BatchId_DayOfWeek_PeriodOrder"" ON ""TimetableSlots"" (""BatchId"", ""DayOfWeek"", ""PeriodOrder"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Users_UserId"" ON ""Users"" (""UserId"");
");
        }

        private static void CreateForeignKeysIfNotExists(MigrationBuilder mb)
        {
            AddFkIfNotExists(mb, "FeeStructures", "FK_FeeStructures_AcademicYears_AcademicYearId", "AcademicYearId", "AcademicYears", "Id");
            AddFkIfNotExists(mb, "FeeStructures", "FK_FeeStructures_Classes_ClassId", "ClassId", "Classes", "Id");
            AddFkIfNotExists(mb, "Batches", "FK_Batches_AcademicYears_AcademicYearId", "AcademicYearId", "AcademicYears", "Id");
            AddFkIfNotExists(mb, "Batches", "FK_Batches_Classes_ClassId", "ClassId", "Classes", "Id");
            AddFkIfNotExists(mb, "RolePermissions", "FK_RolePermissions_Roles_RoleId", "RoleId", "Roles", "Id", cascade: true);
            AddFkIfNotExists(mb, "StudentEnrollments", "FK_StudentEnrollments_AcademicYears_AcademicYearId", "AcademicYearId", "AcademicYears", "Id", cascade: true);
            AddFkIfNotExists(mb, "StudentEnrollments", "FK_StudentEnrollments_Students_StudentId", "StudentId", "Students", "Id", cascade: true);
            AddFkIfNotExists(mb, "ClassSubjects", "FK_ClassSubjects_Classes_ClassId", "ClassId", "Classes", "Id");
            AddFkIfNotExists(mb, "ClassSubjects", "FK_ClassSubjects_Subjects_SubjectId", "SubjectId", "Subjects", "Id");
            AddFkIfNotExists(mb, "TeacherSalaryPaymentLines", "FK_TeacherSalaryPaymentLines_TeacherSalaryPayments_TeacherSalaryPaymentId", "TeacherSalaryPaymentId", "TeacherSalaryPayments", "Id", cascade: true);
        }

        private static void AddFkIfNotExists(MigrationBuilder mb, string table, string constraintName, string column, string principalTable, string principalColumn, bool cascade = false)
        {
            var onDelete = cascade ? "CASCADE" : "RESTRICT";
            mb.Sql($@"
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '{constraintName}') THEN
        ALTER TABLE ""{table}"" ADD CONSTRAINT ""{constraintName}"" FOREIGN KEY (""{column}"") REFERENCES ""{principalTable}"" (""{principalColumn}"") ON DELETE {onDelete};
    END IF;
END $$;");
        }

        private static void DropTablesIfExists(MigrationBuilder mb)
        {
            mb.Sql(@"
DROP TABLE IF EXISTS ""AdmissionApprovals"";
DROP TABLE IF EXISTS ""AdmissionNumberSequences"";
DROP TABLE IF EXISTS ""Announcements"";
DROP TABLE IF EXISTS ""Applications"";
DROP TABLE IF EXISTS ""AttendanceRecords"";
DROP TABLE IF EXISTS ""AuditLogs"";
DROP TABLE IF EXISTS ""Batches"";
DROP TABLE IF EXISTS ""ClassSubjects"";
DROP TABLE IF EXISTS ""CustomFieldDefinitions"";
DROP TABLE IF EXISTS ""Documents"";
DROP TABLE IF EXISTS ""Enquiries"";
DROP TABLE IF EXISTS ""Exams"";
DROP TABLE IF EXISTS ""FeeCharges"";
DROP TABLE IF EXISTS ""FeeStructures"";
DROP TABLE IF EXISTS ""LeaveRequests"";
DROP TABLE IF EXISTS ""MarksEntries"";
DROP TABLE IF EXISTS ""Notifications"";
DROP TABLE IF EXISTS ""Payments"";
DROP TABLE IF EXISTS ""PeriodConfigs"";
DROP TABLE IF EXISTS ""PortalRequests"";
DROP TABLE IF EXISTS ""ReceiptSequences"";
DROP TABLE IF EXISTS ""RolePermissions"";
DROP TABLE IF EXISTS ""SchoolExpenses"";
DROP TABLE IF EXISTS ""Schools"";
DROP TABLE IF EXISTS ""SiblingGroups"";
DROP TABLE IF EXISTS ""StudentEnrollments"";
DROP TABLE IF EXISTS ""StudentParents"";
DROP TABLE IF EXISTS ""StudentStatusHistories"";
DROP TABLE IF EXISTS ""Substitutions"";
DROP TABLE IF EXISTS ""TeacherSalaries"";
DROP TABLE IF EXISTS ""TeacherSalaryPaymentLines"";
DROP TABLE IF EXISTS ""TimetableSettings"";
DROP TABLE IF EXISTS ""TimetableSlots"";
DROP TABLE IF EXISTS ""Users"";
DROP TABLE IF EXISTS ""Classes"";
DROP TABLE IF EXISTS ""Subjects"";
DROP TABLE IF EXISTS ""Roles"";
DROP TABLE IF EXISTS ""AcademicYears"";
DROP TABLE IF EXISTS ""Students"";
DROP TABLE IF EXISTS ""TeacherSalaryPayments"";
");
        }
    }
}
