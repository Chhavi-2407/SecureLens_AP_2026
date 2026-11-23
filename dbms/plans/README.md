
# PostgreSQL Query Execution Plans

## Objective

This directory contains PostgreSQL execution plans generated during the performance analysis of the SecureLens database.

## Tools Used

- PostgreSQL
- EXPLAIN
- EXPLAIN ANALYZE
- EXPLAIN (ANALYZE, BUFFERS, VERBOSE)

## Execution Plan Generation

Use the following format:

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM scans;
```

Save the actual output in a `.txt` file.

## Directory Structure

```text
dbms/
├── 05_query_timings.md
└── plans/
    ├── README.md
    ├── query_01_before.txt
    ├── query_01_after.txt
    ├── query_02_before.txt
    ├── query_02_after.txt
    ├── query_03_before.txt
    ├── query_03_after.txt
    ├── query_04_before.txt
    ├── query_04_after.txt
    ├── query_05_before.txt
    └── query_05_after.txt
```

## Analysis Criteria

Each execution plan is examined for:

1. Scan type
2. Estimated and actual rows
3. Planning time
4. Execution time
5. Shared buffer hits and reads
6. Index utilization

## Comparison

The before and after execution plans are compared to determine whether the applied optimizations improve query performance.

Only actual PostgreSQL-generated execution plans should be included.
