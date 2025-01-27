# MOH-TOSP Scripts

## Summary

This folder contains developer/ops scripts to update MOH TOSP collection in our DB.

Note: The full steps are covered in [runbook](https://www.notion.so/opengov/Isomer-Next-Runbook-13177dbba78880f4835cdd370c11eef6?pvs=4#16477dbba7888045aadad0fee69c5f79).

To perform the update, this is the overall sequence we will undertake:

1. We will backup the existing collection
2. Load the new collection into DB with all resources in "Draft" state in a different permalink e.g. `cost-financing-new`
3. We will verify the new collection on Studio
4. We will rename the old collection's permalink and swap it with the new collection. E.g. `/cost-financing` becomes `/cost-financing-old`, `/cost-financing-new` is renamed to become `/cost-financing`
5. We will then publish this new draft collection

### Pre-requisites

- Ensure you have the necessary environment variables set up before running these scripts.

### Running the scripts

Use `source .env && npx tsx prisma/scripts/moh-tosp/<script-name>` within `isomer/apps/studio` directory to run any of the scripts.

## Scripts

### 1. `backupCollectionById.ts`

This script takes in 2 input arguments which is the `collectionId` and the `backupDirectory`. Given these params, the script "downloads" the existing collection into the local path of your computer for backup purposes.

### 2. `createCollectionFromLocal.ts`

Pre-requisites:
You will need a folder with the collection to be loaded in the following structure:

```
/content                  ----> contentDir
    /cost-financing       ----> collectionName
    cost-financing.json   ----> indexPageName
```

This script takes in the following arguments:

1. `contentDir`: path to the folder that contains the collection to be loaded into DB
2. `collectionName`: name of the collection to be loaded into DB (e.g. `cost-financing`)
3. `indexPageName`: name of the index page of the collection to be loaded into DB (e.g. `cost-financing`)
4. `indexPageTitle`: name of the index page to show visually (e.g. `Cost financing`)
5. `nameOfNewCollectionToCreate`: This is the name of collection to be created in the DB. This will also become the permalink for the new collection. e.g. `cost-financing-new`
6. `siteId`: ID of the site to create the collection into

### 3. `publishDraftCollection.ts`

This script publishes the draft collection that was created. To do so, it requires the following arguments:

1. `publisherId`: ID of the Studio user who is publishing the collection. This ID can be obtained from the `User` table. Make sure this user has access to the site as well.
2. `collectionId`: ID of the collection to be published. You can check this in the `Resource` table on the `id` column.

### 4. `deleteCollectionById.ts`

**Note: Use this with caution as it is NON-RECOVERABLE**.

This script deletes a collection and its contents. It takes the following arguments:

1. `collectionIdToDelete`: ID of the collection to be deleted. Can be checked in the `Resource` table
2. `siteId`: ID of the site to which the collection belongs to

## Recovery Options

In case that the migration needs to be unrolled back to original state, we can execute the same steps described in "Summary" section using the backup taken.

For full details, refer to the [runbook](https://www.notion.so/opengov/Isomer-Next-Runbook-13177dbba78880f4835cdd370c11eef6?pvs=4#16477dbba7888045aadad0fee69c5f79).
