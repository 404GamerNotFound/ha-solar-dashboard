export const DEFAULT_HISTORY_REQUEST_CONCURRENCY = 2;
const MAX_HISTORY_REQUEST_CONCURRENCY = 6;

export function normalizeHistoryRequestConcurrency(
  value,
  fallback = DEFAULT_HISTORY_REQUEST_CONCURRENCY,
  max = MAX_HISTORY_REQUEST_CONCURRENCY,
) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(1, number));
}

export function createHistoryQueueMethods({
  defaultConcurrency = DEFAULT_HISTORY_REQUEST_CONCURRENCY,
} = {}) {
  return {
    _historyRequestConcurrency() {
      return normalizeHistoryRequestConcurrency(this.config?.history_request_concurrency, defaultConcurrency);
    },

    _ensureHistoryRequestQueue() {
      this._historyRequestQueue = this._historyRequestQueue || [];
      this._historyRequestJobs = this._historyRequestJobs || new Map();
      this._historyRequestActiveCount = this._historyRequestActiveCount || 0;
      this._historyRequestSequence = this._historyRequestSequence || 0;
    },

    _sortHistoryRequestQueue() {
      this._historyRequestQueue?.sort((a, b) => (
        (b.priority - a.priority)
        || (a.sequence - b.sequence)
      ));
    },

    _queueHistoryRequest(key, requestFn, { priority = 0 } = {}) {
      if (!key || typeof requestFn !== "function") {
        return Promise.reject(new Error("Invalid history request"));
      }
      this._ensureHistoryRequestQueue();
      const existingJob = this._historyRequestJobs.get(key);
      if (existingJob) {
        existingJob.priority = Math.max(existingJob.priority, Number(priority) || 0);
        if (!existingJob.started) this._sortHistoryRequestQueue();
        return existingJob.promise;
      }

      const job = {
        key,
        requestFn,
        priority: Number(priority) || 0,
        sequence: this._historyRequestSequence += 1,
        started: false,
      };
      job.promise = new Promise((resolve, reject) => {
        job.resolve = resolve;
        job.reject = reject;
      });
      this._historyRequestJobs.set(key, job);
      this._historyRequestQueue.push(job);
      this._sortHistoryRequestQueue();
      this._drainHistoryRequestQueue();
      return job.promise;
    },

    _drainHistoryRequestQueue() {
      this._ensureHistoryRequestQueue();
      const limit = this._historyRequestConcurrency();
      while (this._historyRequestActiveCount < limit && this._historyRequestQueue.length > 0) {
        this._sortHistoryRequestQueue();
        const job = this._historyRequestQueue.shift();
        if (!job || this._historyRequestJobs.get(job.key) !== job) continue;
        job.started = true;
        this._historyRequestActiveCount += 1;
        Promise.resolve()
          .then(() => job.requestFn())
          .then(job.resolve, job.reject)
          .finally(() => {
            this._historyRequestActiveCount = Math.max(0, (this._historyRequestActiveCount || 1) - 1);
            if (this._historyRequestJobs?.get(job.key) === job) this._historyRequestJobs.delete(job.key);
            this._drainHistoryRequestQueue();
          });
      }
    },

    _clearPendingHistoryRequests(prefix = "") {
      if (!this._historyRequestQueue?.length || !this._historyRequestJobs) return;
      const keep = [];
      for (const job of this._historyRequestQueue) {
        if (job.started || (prefix && !String(job.key).startsWith(prefix))) {
          keep.push(job);
          continue;
        }
        if (this._historyRequestJobs.get(job.key) === job) this._historyRequestJobs.delete(job.key);
        job.reject?.(new Error("History request cancelled"));
      }
      this._historyRequestQueue = keep;
    },
  };
}
