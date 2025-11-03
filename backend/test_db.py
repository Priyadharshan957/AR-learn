import motor.motor_asyncio, asyncio, certifi

async def test():
    client = motor.motor_asyncio.AsyncIOMotorClient(
        "mongodb+srv://dharshan0814f:Kdharshan5%40@cluster0.6ettfx6.mongodb.net/ar_learning_db?retryWrites=true&w=majority&appName=Cluster0",
        tlsCAFile=certifi.where()
    )
    print(await client.list_database_names())

asyncio.run(test())
