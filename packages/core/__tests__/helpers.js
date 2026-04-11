"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeField = makeField;
exports.makeStep = makeStep;
exports.makeApiContract = makeApiContract;
/** Create a minimal field definition for testing */
function makeField(overrides) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return {
        id: (_a = overrides.id) !== null && _a !== void 0 ? _a : `field_${overrides.key}`,
        versionId: (_b = overrides.versionId) !== null && _b !== void 0 ? _b : 'v1',
        key: overrides.key,
        label: (_c = overrides.label) !== null && _c !== void 0 ? _c : overrides.key,
        type: (_d = overrides.type) !== null && _d !== void 0 ? _d : 'SHORT_TEXT',
        required: (_e = overrides.required) !== null && _e !== void 0 ? _e : false,
        order: (_f = overrides.order) !== null && _f !== void 0 ? _f : 0,
        config: (_g = overrides.config) !== null && _g !== void 0 ? _g : {},
        stepId: (_h = overrides.stepId) !== null && _h !== void 0 ? _h : null,
        sectionId: (_j = overrides.sectionId) !== null && _j !== void 0 ? _j : null,
        parentFieldId: (_k = overrides.parentFieldId) !== null && _k !== void 0 ? _k : null,
        conditions: (_l = overrides.conditions) !== null && _l !== void 0 ? _l : null,
        children: overrides.children,
    };
}
/** Create a minimal step definition for testing */
function makeStep(overrides) {
    var _a, _b, _c, _d;
    return {
        id: overrides.id,
        versionId: (_a = overrides.versionId) !== null && _a !== void 0 ? _a : 'v1',
        title: overrides.title,
        order: (_b = overrides.order) !== null && _b !== void 0 ? _b : 0,
        conditions: (_c = overrides.conditions) !== null && _c !== void 0 ? _c : null,
        config: (_d = overrides.config) !== null && _d !== void 0 ? _d : null,
        fields: overrides.fields,
    };
}
/** Create a step API contract for testing */
function makeApiContract(overrides) {
    var _a, _b, _c, _d;
    return {
        resourceName: (_a = overrides.resourceName) !== null && _a !== void 0 ? _a : 'TestResource',
        endpoint: (_b = overrides.endpoint) !== null && _b !== void 0 ? _b : '/api/test/{id}',
        method: (_c = overrides.method) !== null && _c !== void 0 ? _c : 'PUT',
        fieldMapping: (_d = overrides.fieldMapping) !== null && _d !== void 0 ? _d : {},
        responseToContext: overrides.responseToContext,
        contextToBody: overrides.contextToBody,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlbHBlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSw4QkFnQkM7QUFHRCw0QkFVQztBQUdELDBDQVNDO0FBMUNELG9EQUFvRDtBQUNwRCxTQUFnQixTQUFTLENBQUMsU0FBK0M7O0lBQ3ZFLE9BQU87UUFDTCxFQUFFLEVBQUUsTUFBQSxTQUFTLENBQUMsRUFBRSxtQ0FBSSxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDNUMsU0FBUyxFQUFFLE1BQUEsU0FBUyxDQUFDLFNBQVMsbUNBQUksSUFBSTtRQUN0QyxHQUFHLEVBQUUsU0FBUyxDQUFDLEdBQUc7UUFDbEIsS0FBSyxFQUFFLE1BQUEsU0FBUyxDQUFDLEtBQUssbUNBQUksU0FBUyxDQUFDLEdBQUc7UUFDdkMsSUFBSSxFQUFFLE1BQUEsU0FBUyxDQUFDLElBQUksbUNBQUksWUFBWTtRQUNwQyxRQUFRLEVBQUUsTUFBQSxTQUFTLENBQUMsUUFBUSxtQ0FBSSxLQUFLO1FBQ3JDLEtBQUssRUFBRSxNQUFBLFNBQVMsQ0FBQyxLQUFLLG1DQUFJLENBQUM7UUFDM0IsTUFBTSxFQUFFLE1BQUEsU0FBUyxDQUFDLE1BQU0sbUNBQUksRUFBRTtRQUM5QixNQUFNLEVBQUUsTUFBQSxTQUFTLENBQUMsTUFBTSxtQ0FBSSxJQUFJO1FBQ2hDLFNBQVMsRUFBRSxNQUFBLFNBQVMsQ0FBQyxTQUFTLG1DQUFJLElBQUk7UUFDdEMsYUFBYSxFQUFFLE1BQUEsU0FBUyxDQUFDLGFBQWEsbUNBQUksSUFBSTtRQUM5QyxVQUFVLEVBQUUsTUFBQSxTQUFTLENBQUMsVUFBVSxtQ0FBSSxJQUFJO1FBQ3hDLFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUTtLQUM3QixDQUFBO0FBQ0gsQ0FBQztBQUVELG1EQUFtRDtBQUNuRCxTQUFnQixRQUFRLENBQUMsU0FBNEQ7O0lBQ25GLE9BQU87UUFDTCxFQUFFLEVBQUUsU0FBUyxDQUFDLEVBQUU7UUFDaEIsU0FBUyxFQUFFLE1BQUEsU0FBUyxDQUFDLFNBQVMsbUNBQUksSUFBSTtRQUN0QyxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUs7UUFDdEIsS0FBSyxFQUFFLE1BQUEsU0FBUyxDQUFDLEtBQUssbUNBQUksQ0FBQztRQUMzQixVQUFVLEVBQUUsTUFBQSxTQUFTLENBQUMsVUFBVSxtQ0FBSSxJQUFJO1FBQ3hDLE1BQU0sRUFBRSxNQUFBLFNBQVMsQ0FBQyxNQUFNLG1DQUFJLElBQUk7UUFDaEMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxNQUFNO0tBQ3pCLENBQUE7QUFDSCxDQUFDO0FBRUQsNkNBQTZDO0FBQzdDLFNBQWdCLGVBQWUsQ0FBQyxTQUFtQzs7SUFDakUsT0FBTztRQUNMLFlBQVksRUFBRSxNQUFBLFNBQVMsQ0FBQyxZQUFZLG1DQUFJLGNBQWM7UUFDdEQsUUFBUSxFQUFFLE1BQUEsU0FBUyxDQUFDLFFBQVEsbUNBQUksZ0JBQWdCO1FBQ2hELE1BQU0sRUFBRSxNQUFBLFNBQVMsQ0FBQyxNQUFNLG1DQUFJLEtBQUs7UUFDakMsWUFBWSxFQUFFLE1BQUEsU0FBUyxDQUFDLFlBQVksbUNBQUksRUFBRTtRQUMxQyxpQkFBaUIsRUFBRSxTQUFTLENBQUMsaUJBQWlCO1FBQzlDLGFBQWEsRUFBRSxTQUFTLENBQUMsYUFBYTtLQUN2QyxDQUFBO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRm9ybUZpZWxkLCBGb3JtU3RlcCwgU3RlcEFwaUNvbnRyYWN0IH0gZnJvbSAnLi4vc3JjL3R5cGVzJ1xuXG4vKiogQ3JlYXRlIGEgbWluaW1hbCBmaWVsZCBkZWZpbml0aW9uIGZvciB0ZXN0aW5nICovXG5leHBvcnQgZnVuY3Rpb24gbWFrZUZpZWxkKG92ZXJyaWRlczogUGFydGlhbDxGb3JtRmllbGQ+ICYgeyBrZXk6IHN0cmluZyB9KTogRm9ybUZpZWxkIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogb3ZlcnJpZGVzLmlkID8/IGBmaWVsZF8ke292ZXJyaWRlcy5rZXl9YCxcbiAgICB2ZXJzaW9uSWQ6IG92ZXJyaWRlcy52ZXJzaW9uSWQgPz8gJ3YxJyxcbiAgICBrZXk6IG92ZXJyaWRlcy5rZXksXG4gICAgbGFiZWw6IG92ZXJyaWRlcy5sYWJlbCA/PyBvdmVycmlkZXMua2V5LFxuICAgIHR5cGU6IG92ZXJyaWRlcy50eXBlID8/ICdTSE9SVF9URVhUJyxcbiAgICByZXF1aXJlZDogb3ZlcnJpZGVzLnJlcXVpcmVkID8/IGZhbHNlLFxuICAgIG9yZGVyOiBvdmVycmlkZXMub3JkZXIgPz8gMCxcbiAgICBjb25maWc6IG92ZXJyaWRlcy5jb25maWcgPz8ge30sXG4gICAgc3RlcElkOiBvdmVycmlkZXMuc3RlcElkID8/IG51bGwsXG4gICAgc2VjdGlvbklkOiBvdmVycmlkZXMuc2VjdGlvbklkID8/IG51bGwsXG4gICAgcGFyZW50RmllbGRJZDogb3ZlcnJpZGVzLnBhcmVudEZpZWxkSWQgPz8gbnVsbCxcbiAgICBjb25kaXRpb25zOiBvdmVycmlkZXMuY29uZGl0aW9ucyA/PyBudWxsLFxuICAgIGNoaWxkcmVuOiBvdmVycmlkZXMuY2hpbGRyZW4sXG4gIH1cbn1cblxuLyoqIENyZWF0ZSBhIG1pbmltYWwgc3RlcCBkZWZpbml0aW9uIGZvciB0ZXN0aW5nICovXG5leHBvcnQgZnVuY3Rpb24gbWFrZVN0ZXAob3ZlcnJpZGVzOiBQYXJ0aWFsPEZvcm1TdGVwPiAmIHsgaWQ6IHN0cmluZzsgdGl0bGU6IHN0cmluZyB9KTogRm9ybVN0ZXAge1xuICByZXR1cm4ge1xuICAgIGlkOiBvdmVycmlkZXMuaWQsXG4gICAgdmVyc2lvbklkOiBvdmVycmlkZXMudmVyc2lvbklkID8/ICd2MScsXG4gICAgdGl0bGU6IG92ZXJyaWRlcy50aXRsZSxcbiAgICBvcmRlcjogb3ZlcnJpZGVzLm9yZGVyID8/IDAsXG4gICAgY29uZGl0aW9uczogb3ZlcnJpZGVzLmNvbmRpdGlvbnMgPz8gbnVsbCxcbiAgICBjb25maWc6IG92ZXJyaWRlcy5jb25maWcgPz8gbnVsbCxcbiAgICBmaWVsZHM6IG92ZXJyaWRlcy5maWVsZHMsXG4gIH1cbn1cblxuLyoqIENyZWF0ZSBhIHN0ZXAgQVBJIGNvbnRyYWN0IGZvciB0ZXN0aW5nICovXG5leHBvcnQgZnVuY3Rpb24gbWFrZUFwaUNvbnRyYWN0KG92ZXJyaWRlczogUGFydGlhbDxTdGVwQXBpQ29udHJhY3Q+KTogU3RlcEFwaUNvbnRyYWN0IHtcbiAgcmV0dXJuIHtcbiAgICByZXNvdXJjZU5hbWU6IG92ZXJyaWRlcy5yZXNvdXJjZU5hbWUgPz8gJ1Rlc3RSZXNvdXJjZScsXG4gICAgZW5kcG9pbnQ6IG92ZXJyaWRlcy5lbmRwb2ludCA/PyAnL2FwaS90ZXN0L3tpZH0nLFxuICAgIG1ldGhvZDogb3ZlcnJpZGVzLm1ldGhvZCA/PyAnUFVUJyxcbiAgICBmaWVsZE1hcHBpbmc6IG92ZXJyaWRlcy5maWVsZE1hcHBpbmcgPz8ge30sXG4gICAgcmVzcG9uc2VUb0NvbnRleHQ6IG92ZXJyaWRlcy5yZXNwb25zZVRvQ29udGV4dCxcbiAgICBjb250ZXh0VG9Cb2R5OiBvdmVycmlkZXMuY29udGV4dFRvQm9keSxcbiAgfVxufVxuIl19