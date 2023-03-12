Getting lambda to work with dynamodb and elasticache

This week I spent so much time trying to get `lambda` to work with `dynmodb` and `elasticache`. Everything worked well with `lambda` and `dynamodb` until I tried to integrate `elasticache`. 

While I was working with integrating `elasticache` and `lambda`, I created a VPC and put `lambda` and `elasticache` in the same VPC. I didn't realize that's when everything broke. Looking back, it feels so stupid. I was trying to debug why I couldn't connect to redis.



```python
    redis_name = os.environ.get('REDIS_NAME')
    logger.debug('table name: {0}'.format(table_name))
    logger.debug('redis name: {0}'.format(redis_name))
    dynamo_client = boto3.resource('dynamodb', region_name=region)
    rconn = redis.Redis(host=redis_name, port=6379, db=0)
    dynamo_table = dynamo_client.Table(table_name)

```



I can see `redis name` getting logged into cloudwatch logs but then lambda timeout. Finally, I used my brain and decided to comment `redis.Redis` from the code. Then it hit me like a ton of bricks, *it wasn't redis connection timeout but dynamodb*.

After that debugging got easier, because placing `lambda` into a VPC caused it to loose connection to the internet. In order to fix it, I had to re-create VPC with internetgateway and NAT so that `lambda` can connect to the internet. Apparently, `lambda` connects to the dynamodb over the internet. Who knew ! 
