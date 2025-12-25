# AWS Deployment Fixes for Diamond Business

## Issues Fixed

### 1. **File Path & Permissions**
- Added comprehensive logging for file paths
- Added file permission checks before read/write operations
- Added directory creation if it doesn't exist
- Set proper file permissions (0o666 for files, 0o755 for directories)

### 2. **Error Handling**
- Enhanced error messages with file paths
- Added try-catch blocks with detailed logging
- Graceful fallbacks instead of crashes
- Stack trace logging for debugging

### 3. **Data Validation**
- Verify data after write operations
- Check file existence and readability before operations
- Validate array structure before processing
- Skip invalid entries instead of crashing

### 4. **Logging & Debugging**
- Added `[Diamond]` prefix to all logs for easy filtering
- Log file paths, working directory, and environment
- Log entry counts at each step
- Health check endpoint for monitoring

## New Features

### Health Check Endpoint
```
GET /health
```
Returns:
- System status
- File accessibility
- Data counts
- Environment info
- Working directory

## AWS-Specific Considerations

### File Permissions
On AWS, ensure the application user has:
- Read/write permissions to the application directory
- Permission to create files if they don't exist

### Environment Variables
Set these in AWS:
- `NODE_ENV=production`
- `PORT=3005` (or your configured port)

### File System
- Ensure `database.json` exists or can be created
- Check disk space availability
- Verify write permissions on the directory

## Testing on AWS

1. **Check Health Endpoint:**
   ```bash
   curl http://your-aws-instance:3005/health
   ```

2. **Check Logs:**
   Look for `[Diamond]` prefixed logs to see:
   - File paths being used
   - Entry counts
   - Any permission errors

3. **Test API:**
   ```bash
   # Get entries
   curl http://your-aws-instance:3005/api/finance
   
   # Create entry
   curl -X POST http://your-aws-instance:3005/api/finance \
     -H "Content-Type: application/json" \
     -d '{"type":"debit","expenseType":"Expense","category":"Test","description":"Test","amount":100}'
   ```

## Common AWS Issues & Solutions

### Issue: "Cannot read file"
**Solution:** Check file permissions and path
```bash
ls -la /path/to/database.json
chmod 666 /path/to/database.json
```

### Issue: "Cannot write file"
**Solution:** Check directory permissions
```bash
ls -la /path/to/
chmod 755 /path/to/
```

### Issue: "File not found"
**Solution:** Ensure file exists or can be created
```bash
touch /path/to/database.json
chmod 666 /path/to/database.json
```

## Logging

All Diamond business operations now log with `[Diamond]` prefix:
- `[Diamond] Loading data from: /path/to/file`
- `[Diamond] Loaded X entries`
- `[Diamond] Saving X entries`
- `[Diamond] Error: ...`

This makes it easy to filter logs in AWS CloudWatch or other logging systems.

