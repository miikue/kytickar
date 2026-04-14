CREATE TABLE "activity_log" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "event_type" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "label" TEXT,
  "entity_id" INTEGER,
  "details" TEXT
);

CREATE INDEX "activity_log_created_at_idx" ON "activity_log"("created_at");