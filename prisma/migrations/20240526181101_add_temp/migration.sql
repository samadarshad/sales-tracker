-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tracker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteUrl" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "faviconUrl" TEXT NOT NULL,
    "aiPrompt" TEXT NOT NULL,
    "temporary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Tracker_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tracker" ("aiPrompt", "authorId", "createdAt", "faviconUrl", "id", "previewUrl", "updatedAt", "websiteUrl") SELECT "aiPrompt", "authorId", "createdAt", "faviconUrl", "id", "previewUrl", "updatedAt", "websiteUrl" FROM "Tracker";
DROP TABLE "Tracker";
ALTER TABLE "new_Tracker" RENAME TO "Tracker";
PRAGMA foreign_key_check("Tracker");
PRAGMA foreign_keys=ON;
