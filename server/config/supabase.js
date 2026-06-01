const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl =
    (process.env.SUPABASE_URL && process.env.SUPABASE_URL.trim()) ||
    (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.trim());
const supabaseKey =
    (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()) ||
    (process.env.VITE_SUPABASE_PUBLISHABLE_KEY && process.env.VITE_SUPABASE_PUBLISHABLE_KEY.trim());

const isMock = !supabaseUrl || !supabaseKey ||
               supabaseUrl.includes('mock') || supabaseUrl.includes('localhost') ||
               supabaseKey.includes('mock');

let supabase;

if (isMock) {
    console.warn(
        '\n[Supabase Warning] Missing or mock SUPABASE_URL / keys in environment variables.'
    );
    console.warn(
        '[Supabase Mock] Activating seamless local JSON database mock layer in "server/data/mock_db/".\n'
    );

    const mockDir = path.join(__dirname, '..', 'data', 'mock_db');
    if (!fs.existsSync(mockDir)) {
        fs.mkdirSync(mockDir, { recursive: true });
    }

    function readTable(table) {
        const file = path.join(mockDir, `${table}.json`);
        if (!fs.existsSync(file)) {
            return [];
        }
        try {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    function writeTable(table, data) {
        const file = path.join(mockDir, `${table}.json`);
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    }

    class SupabaseQueryBuilder {
        constructor(tableName) {
            this.tableName = tableName;
            this.filters = [];
            this.orders = [];
            this.limitNum = null;
            this.op = 'select';
            this.insertData = null;
            this.updateData = null;
            this.upsertOnConflict = null;
            this.countOption = null;
            this.headOption = false;
        }

        select(fields, options = {}) {
            this.fields = fields;
            if (options.count) {
                this.countOption = options.count;
            }
            if (options.head) {
                this.headOption = true;
            }
            return this;
        }

        insert(data) {
            this.op = 'insert';
            this.insertData = data;
            return this;
        }

        update(data) {
            this.op = 'update';
            this.updateData = data;
            return this;
        }

        delete() {
            this.op = 'delete';
            return this;
        }

        upsert(data, options = {}) {
            this.op = 'upsert';
            this.insertData = data;
            this.upsertOnConflict = options.onConflict;
            return this;
        }

        eq(field, val) {
            this.filters.push({ type: 'eq', field, val });
            return this;
        }

        neq(field, val) {
            this.filters.push({ type: 'neq', field, val });
            return this;
        }

        in(field, arr) {
            this.filters.push({ type: 'in', field, val: arr });
            return this;
        }

        or(conds) {
            this.filters.push({ type: 'or', conds });
            return this;
        }

        ilike(field, pattern) {
            this.filters.push({ type: 'ilike', field, pattern });
            return this;
        }

        order(field, options = {}) {
            this.orders.push({ field, ascending: options.ascending !== false });
            return this;
        }

        limit(num) {
            this.limitNum = num;
            return this;
        }

        single() {
            return this.then(result => {
                if (result.error) return result;
                if (!result.data || result.data.length === 0) {
                    return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
                }
                return { data: result.data[0], error: null };
            });
        }

        maybeSingle() {
            return this.then(result => {
                if (result.error) return result;
                if (!result.data || result.data.length === 0) {
                    return { data: null, error: null };
                }
                return { data: result.data[0], error: null };
            });
        }

        then(onFulfilled, onRejected) {
            const promise = (async () => {
                try {
                    let currentData = readTable(this.tableName);

                    // Apply filters for operations that select/update/delete
                    if (this.op === 'select' || this.op === 'update' || this.op === 'delete') {
                        for (const filter of this.filters) {
                            if (filter.type === 'eq') {
                                currentData = currentData.filter(
                                    row => String(row[filter.field]).toLowerCase() === String(filter.val).toLowerCase()
                                );
                            } else if (filter.type === 'neq') {
                                currentData = currentData.filter(
                                    row => String(row[filter.field]).toLowerCase() !== String(filter.val).toLowerCase()
                                );
                            } else if (filter.type === 'in') {
                                const vals = filter.val.map(v => String(v).toLowerCase());
                                currentData = currentData.filter(row => vals.includes(String(row[filter.field]).toLowerCase()));
                            } else if (filter.type === 'ilike') {
                                const cleanPattern = filter.pattern || '';
                                const regexPattern = '^' + cleanPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/%/g, '.*') + '$';
                                const regex = new RegExp(regexPattern, 'i');
                                currentData = currentData.filter(row => regex.test(String(row[filter.field] || '')));
                            } else if (filter.type === 'or') {
                                const conds = filter.conds.split(',');
                                currentData = currentData.filter(row => {
                                    return conds.some(cond => {
                                        const parts = cond.trim().split('.');
                                        if (parts.length >= 3) {
                                            const field = parts[0];
                                            const op = parts[1];
                                            const val = parts.slice(2).join('.');
                                            if (op === 'eq') {
                                                return String(row[field] || '').toLowerCase() === String(val).toLowerCase();
                                            } else if (op === 'ilike') {
                                                const cleanPattern = val || '';
                                                const regexPattern = '^' + cleanPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/%/g, '.*') + '$';
                                                const regex = new RegExp(regexPattern, 'i');
                                                return regex.test(String(row[field] || ''));
                                            }
                                        }
                                        return false;
                                    });
                                });
                            }
                        }
                    }

                    let returnedData = null;
                    let count = null;

                    if (this.op === 'select') {
                        // Apply relationship joining
                        if (this.tableName === 'activity_logs' && this.fields && this.fields.includes('user:users')) {
                            const users = readTable('users');
                            currentData = currentData.map(log => {
                                const user = users.find(u => u.id === log.user_id);
                                if (user) {
                                    const { username, email, role } = user;
                                    return { ...log, user: { username, email, role } };
                                }
                                return { ...log, user: null };
                            });
                        }

                        // Apply ordering
                        for (const ord of this.orders) {
                            currentData.sort((a, b) => {
                                const valA = a[ord.field];
                                const valB = b[ord.field];
                                if (valA < valB) return ord.ascending ? -1 : 1;
                                if (valA > valB) return ord.ascending ? 1 : -1;
                                return 0;
                            });
                        }
                        if (this.limitNum !== null) {
                            currentData = currentData.slice(0, this.limitNum);
                        }
                        returnedData = this.headOption ? null : currentData;
                        if (this.countOption === 'exact') {
                            count = currentData.length;
                        }
                    } else if (this.op === 'insert') {
                        const toInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
                        const fullData = readTable(this.tableName);
                        const newRows = toInsert.map(row => {
                            const newRow = { ...row };
                            if (!newRow.id) {
                                newRow.id = 'mock-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
                            }
                            if (!newRow.created_at) {
                                newRow.created_at = new Date().toISOString();
                            }
                            if (!newRow.updated_at) {
                                newRow.updated_at = new Date().toISOString();
                            }
                            return newRow;
                        });
                        fullData.push(...newRows);
                        writeTable(this.tableName, fullData);
                        returnedData = newRows;
                    } else if (this.op === 'update') {
                        const fullData = readTable(this.tableName);
                        const matchingIds = currentData.map(row => row.id);
                        const updatedRows = [];
                        const updatedFullData = fullData.map(row => {
                            if (matchingIds.includes(row.id)) {
                                const updated = { ...row, ...this.updateData, updated_at: new Date().toISOString() };
                                updatedRows.push(updated);
                                return updated;
                            }
                            return row;
                        });
                        writeTable(this.tableName, updatedFullData);
                        returnedData = updatedRows;
                    } else if (this.op === 'delete') {
                        const fullData = readTable(this.tableName);
                        const matchingIds = currentData.map(row => row.id);
                        const remainingData = fullData.filter(row => !matchingIds.includes(row.id));
                        writeTable(this.tableName, remainingData);
                        returnedData = currentData;
                    } else if (this.op === 'upsert') {
                        const toUpsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
                        const fullData = readTable(this.tableName);
                        const onConflictField = this.upsertOnConflict || 'id';

                        const upsertedRows = toUpsert.map(row => {
                            const existingIdx = fullData.findIndex(r => String(r[onConflictField]) === String(row[onConflictField]));
                            const nowStr = new Date().toISOString();
                            if (existingIdx !== -1) {
                                const updated = { ...fullData[existingIdx], ...row, updated_at: nowStr };
                                fullData[existingIdx] = updated;
                                return updated;
                            } else {
                                const newRow = { ...row };
                                if (!newRow.id) {
                                    newRow.id = 'mock-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
                                }
                                if (!newRow.created_at) {
                                    newRow.created_at = nowStr;
                                }
                                if (!newRow.updated_at) {
                                    newRow.updated_at = nowStr;
                                }
                                fullData.push(newRow);
                                return newRow;
                            }
                        });
                        writeTable(this.tableName, fullData);
                        returnedData = upsertedRows;
                    }

                    const result = { data: returnedData, error: null };
                    if (count !== null) {
                        result.count = count;
                    }
                    return result;
                } catch (err) {
                    console.error('Mock DB Query Error:', err);
                    return { data: null, error: { message: err.message || String(err) } };
                }
            })();

            return promise.then(onFulfilled, onRejected);
        }
    }

    supabase = {
        from: (tableName) => new SupabaseQueryBuilder(tableName)
    };
} else {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;
