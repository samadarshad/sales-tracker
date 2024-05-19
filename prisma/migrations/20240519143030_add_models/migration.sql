-- CreateTable
CREATE TABLE "Tracker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteUrl" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "faviconUrl" TEXT NOT NULL,
    "aiPrompt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Tracker_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleData" (
    "trackerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "sale" BOOLEAN NOT NULL,

    PRIMARY KEY ("trackerId", "createdAt"),
    CONSTRAINT "SaleData_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "Tracker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favourite" (
    "userId" TEXT NOT NULL,
    "trackerId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "trackerId"),
    CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Favourite_trackerId_fkey" FOREIGN KEY ("trackerId") REFERENCES "Tracker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
