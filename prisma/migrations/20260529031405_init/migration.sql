-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seed" TEXT NOT NULL,
    "studentName" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "currentPhase" INTEGER NOT NULL DEFAULT 1,
    "maxPhase" INTEGER NOT NULL DEFAULT 1,
    "score" REAL NOT NULL DEFAULT 0,
    "detection" REAL NOT NULL DEFAULT 0,
    "budget" REAL NOT NULL DEFAULT 100,
    "flags" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "PhaseRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "enteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "chosenOptionId" TEXT,
    "correct" BOOLEAN,
    "justification" TEXT,
    "interpretationQ" TEXT,
    "interpretationA" TEXT,
    "scoreDelta" REAL NOT NULL DEFAULT 0,
    "detectionDelta" REAL NOT NULL DEFAULT 0,
    "budgetDelta" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PhaseRun_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phase" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    CONSTRAINT "Action_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "phase" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PhaseRun_missionId_idx" ON "PhaseRun"("missionId");

-- CreateIndex
CREATE INDEX "Action_missionId_idx" ON "Action"("missionId");

-- CreateIndex
CREATE INDEX "Evidence_missionId_idx" ON "Evidence"("missionId");
