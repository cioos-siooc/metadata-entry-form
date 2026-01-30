// Utilities to apply DataGrid-like filter and sort models to our rows

// Returns a predicate for quick filter over selected string fields
function makeQuickFilterPredicate(filterModel) {
    const values = (filterModel && filterModel.quickFilterValues) || [];
    if (!values.length) return () => true;
    const needles = values.map((v) => String(v).toLowerCase());
    return (row) => {
        const haystack = [row.title, row.author, row.abstract]
            .filter(Boolean)
            .join(' \n ')
            .toLowerCase();
        return needles.every((n) => haystack.includes(n));
    };
}

// Applies supported filter items from the filter model to rows
export function applyFilters(filterModel, rows) {
    if (!filterModel || (!filterModel.items || filterModel.items.length === 0) && !filterModel.quickFilterValues?.length) {
        return rows;
    }

    const quickFilterOk = makeQuickFilterPredicate(filterModel);

    // Only implement operators we use: status isAnyOf
    const items = (filterModel.items || []).filter(Boolean);

    return rows.filter((row) => {
        if (!quickFilterOk(row)) return false;
        const passes = items.every((item) => {
            const { columnField, operatorValue, value } = item;
            if (columnField === 'status' && operatorValue === 'isAnyOf') {
                const arr = Array.isArray(value) ? value : [];
                return arr.includes(row.status);
            }
            if (columnField === 'author') {
                const needle = String(value || '').toLowerCase();
                const hay = String(row.author || '').toLowerCase();
                if (operatorValue === 'contains') {
                    return hay.includes(needle);
                }
                if (operatorValue === 'equals') {
                    return hay === needle;
                }
                return true;
            }
            return true;
        });
        return passes;
    });
}

// Basic comparators for supported fields
function getComparatorForField(field) {
    switch (field) {
        case 'created':
            return (a, b) => {
                const t1 = a?.created ? new Date(a.created).getTime() : 0;
                const t2 = b?.created ? new Date(b.created).getTime() : 0;
                return t1 - t2;
            };
        case 'progress':
            return (a, b) => (a.progress || 0) - (b.progress || 0);
        case 'title':
            return (a, b) => String(a.title || '').localeCompare(String(b.title || ''));
        case 'author':
            return (a, b) => String(a.author || '').localeCompare(String(b.author || ''));
        default:
            return (a, b) => String(a[field] ?? '').localeCompare(String(b[field] ?? ''));
    }
}

export function applySort(sortModel, rows) {
    if (!Array.isArray(sortModel) || sortModel.length === 0) return rows;
    const [{ field, sort }] = sortModel; // DataGrid v5 supports multi, we handle first
    const cmp = getComparatorForField(field);
    const factor = sort === 'desc' ? -1 : 1;
    const arr = [...rows];
    arr.sort((a, b) => factor * cmp(a, b));
    return arr;
}

export function applyFiltersAndSort({ filterModel, sortModel }, rows) {
    const filtered = applyFilters(filterModel, rows);
    return applySort(sortModel, filtered);
}
