# Revision comparison

- Reported hosted Preview revision: `3cd7a3fbd3fb1a1cf05f9b720d87923d9d00ba83`
- Healthy Preview process workspace revision: `3cd7a3fbd3fb1a1cf05f9b720d87923d9d00ba83`
- Result: **exactly the same revision**.
- That revision is the current project `HEAD`; its only change is this plan file.
- The latest auth/env implementation is commit `6c51d42ca5901b20f95e6a326e03f8deaefae3c8`, which is an ancestor of the reported/current revision. Therefore revision `3cd7a3f…` contains those fixes.
- `x-lovable-project-revision` is the correct project-source revision identifier available here. It compares source snapshots; it does **not** identify or hash the separately injected Vite environment/runtime configuration.

## Exact conclusion

**Same revision but different env/runtime.**

Your browser and the healthy Preview process are running the same source revision. The healthy process receives the Cloud environment values; your hosted browser runtime reports them absent. This rules out a different/stale source revision and isolates the mismatch to Preview environment injection/runtime delivery for the same revision.