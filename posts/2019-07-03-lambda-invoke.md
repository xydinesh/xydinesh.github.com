# Role permission for invoking a lambda function"


```
Lambda Function A --> Lambda Function B
```

We have a lambda function `A` invokes another lambda function `B`. There was a permission error where we were getting
`AccessDeniedException: User is not authorized to perform lambda:InvokeFunction`. We have added `lambda:InvokeFunction` to the role permission but
it didn't fix the issue. Under `Policies` we had to add additional permissions to get this fixed.

Here is a part of SAM template with correct permission.
```
...
Policies:
  - Statement:
      - Action:
          - lambda:Invoke
	  - lambda:InvokeFunction
	  - lambda:ListFunction
        Effect: Allow
	Resource: !GetAtt FunctionB
...
```
