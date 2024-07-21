const { MongoClient } = require('mongodb');

// MongoDB connection string
const uri = 'mongodb://localhost:27017';

async function createRecords() {
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const database = client.db('myDatabase');
        const recordsCollection = database.collection('records');

        const recordsToInsert = [
            { user: 'User1', date: new Date('2024-07-21T08:00:00'), procedure: 'Procedure1' },
            { user: 'User2', date: new Date('2024-07-21T10:00:00'), procedure: 'Procedure2' },
            { user: 'User3', date: new Date('2024-07-21T12:00:00'), procedure: 'Procedure3' },
        ];

        const result = await recordsCollection.insertMany(recordsToInsert);
        console.log(`${result.insertedCount} записей было успешно создано.`);
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

createRecords().catch(console.error);
