"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPluginRegistry = createPluginRegistry;
/**
 * Create a plugin registry for managing custom field types and validators
 */
function createPluginRegistry() {
    const plugins = new Map();
    const fieldTypeMap = new Map();
    const validatorMap = new Map();
    return {
        register(plugin) {
            // Register the plugin itself
            plugins.set(plugin.id, plugin);
            // Index field types
            if (plugin.fieldTypes) {
                for (const fieldType of plugin.fieldTypes) {
                    fieldTypeMap.set(fieldType.type, plugin);
                }
            }
            // Index validators
            if (plugin.validators) {
                for (const validator of plugin.validators) {
                    validatorMap.set(validator.id, validator);
                }
            }
        },
        unregister(pluginId) {
            const plugin = plugins.get(pluginId);
            if (!plugin)
                return;
            // Remove from plugins map
            plugins.delete(pluginId);
            // Remove field types
            if (plugin.fieldTypes) {
                for (const fieldType of plugin.fieldTypes) {
                    fieldTypeMap.delete(fieldType.type);
                }
            }
            // Remove validators
            if (plugin.validators) {
                for (const validator of plugin.validators) {
                    validatorMap.delete(validator.id);
                }
            }
        },
        get(pluginId) {
            return plugins.get(pluginId);
        },
        getAll() {
            return Array.from(plugins.values());
        },
        hasFieldType(type) {
            return fieldTypeMap.has(type);
        },
        validate(validatorId, value, config) {
            const validator = validatorMap.get(validatorId);
            if (!validator) {
                return { valid: false, error: `Validator "${validatorId}" not found` };
            }
            try {
                return validator.validate(value, config);
            }
            catch (err) {
                return {
                    valid: false,
                    error: err instanceof Error ? err.message : String(err),
                };
            }
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2lucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBsdWdpbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFvQkEsb0RBMkVDO0FBOUVEOztHQUVHO0FBQ0gsU0FBZ0Isb0JBQW9CO0lBQ2xDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUE0QixDQUFBO0lBQ25ELE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxFQUE0QixDQUFBO0lBQ3hELE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxFQUFlLENBQUE7SUFFM0MsT0FBTztRQUNMLFFBQVEsQ0FBQyxNQUF3QjtZQUMvQiw2QkFBNkI7WUFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRTlCLG9CQUFvQjtZQUNwQixJQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdEIsS0FBSyxNQUFNLFNBQVMsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQzFDLFlBQVksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDMUMsQ0FBQztZQUNILENBQUM7WUFFRCxtQkFBbUI7WUFDbkIsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RCLEtBQUssTUFBTSxTQUFTLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUMxQyxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUE7Z0JBQzNDLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELFVBQVUsQ0FBQyxRQUFnQjtZQUN6QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQ3BDLElBQUksQ0FBQyxNQUFNO2dCQUFFLE9BQU07WUFFbkIsMEJBQTBCO1lBQzFCLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUE7WUFFeEIscUJBQXFCO1lBQ3JCLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN0QixLQUFLLE1BQU0sU0FBUyxJQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDMUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ3JDLENBQUM7WUFDSCxDQUFDO1lBRUQsb0JBQW9CO1lBQ3BCLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN0QixLQUFLLE1BQU0sU0FBUyxJQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDMUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQ25DLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUFnQjtZQUNsQixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDOUIsQ0FBQztRQUVELE1BQU07WUFDSixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDckMsQ0FBQztRQUVELFlBQVksQ0FBQyxJQUFZO1lBQ3ZCLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUMvQixDQUFDO1FBRUQsUUFBUSxDQUFDLFdBQW1CLEVBQUUsS0FBYyxFQUFFLE1BQWU7WUFDM0QsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUMvQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGNBQWMsV0FBVyxhQUFhLEVBQUUsQ0FBQTtZQUN4RSxDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNILE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDMUMsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2IsT0FBTztvQkFDTCxLQUFLLEVBQUUsS0FBSztvQkFDWixLQUFLLEVBQUUsR0FBRyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztpQkFDeEQsQ0FBQTtZQUNILENBQUM7UUFDSCxDQUFDO0tBQ0YsQ0FBQTtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFBsdWdpbkRlZmluaXRpb24gfSBmcm9tICdAc25hcmp1bjk4L2RmZS1jb3JlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFBsdWdpblJlZ2lzdHJ5IHtcbiAgLyoqIFJlZ2lzdGVyIGEgcGx1Z2luICovXG4gIHJlZ2lzdGVyKHBsdWdpbjogUGx1Z2luRGVmaW5pdGlvbik6IHZvaWRcbiAgLyoqIFVucmVnaXN0ZXIgYSBwbHVnaW4gKi9cbiAgdW5yZWdpc3RlcihwbHVnaW5JZDogc3RyaW5nKTogdm9pZFxuICAvKiogR2V0IGEgcmVnaXN0ZXJlZCBwbHVnaW4gKi9cbiAgZ2V0KHBsdWdpbklkOiBzdHJpbmcpOiBQbHVnaW5EZWZpbml0aW9uIHwgdW5kZWZpbmVkXG4gIC8qKiBHZXQgYWxsIHJlZ2lzdGVyZWQgcGx1Z2lucyAqL1xuICBnZXRBbGwoKTogUGx1Z2luRGVmaW5pdGlvbltdXG4gIC8qKiBDaGVjayBpZiBhIGN1c3RvbSBmaWVsZCB0eXBlIGV4aXN0cyAqL1xuICBoYXNGaWVsZFR5cGUodHlwZTogc3RyaW5nKTogYm9vbGVhblxuICAvKiogVmFsaWRhdGUgYSB2YWx1ZSB1c2luZyBhIHBsdWdpbiB2YWxpZGF0b3IgKi9cbiAgdmFsaWRhdGUodmFsaWRhdG9ySWQ6IHN0cmluZywgdmFsdWU6IHVua25vd24sIGNvbmZpZzogdW5rbm93bik6IHsgdmFsaWQ6IGJvb2xlYW47IGVycm9yPzogc3RyaW5nIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwbHVnaW4gcmVnaXN0cnkgZm9yIG1hbmFnaW5nIGN1c3RvbSBmaWVsZCB0eXBlcyBhbmQgdmFsaWRhdG9yc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGx1Z2luUmVnaXN0cnkoKTogUGx1Z2luUmVnaXN0cnkge1xuICBjb25zdCBwbHVnaW5zID0gbmV3IE1hcDxzdHJpbmcsIFBsdWdpbkRlZmluaXRpb24+KClcbiAgY29uc3QgZmllbGRUeXBlTWFwID0gbmV3IE1hcDxzdHJpbmcsIFBsdWdpbkRlZmluaXRpb24+KClcbiAgY29uc3QgdmFsaWRhdG9yTWFwID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKVxuXG4gIHJldHVybiB7XG4gICAgcmVnaXN0ZXIocGx1Z2luOiBQbHVnaW5EZWZpbml0aW9uKTogdm9pZCB7XG4gICAgICAvLyBSZWdpc3RlciB0aGUgcGx1Z2luIGl0c2VsZlxuICAgICAgcGx1Z2lucy5zZXQocGx1Z2luLmlkLCBwbHVnaW4pXG5cbiAgICAgIC8vIEluZGV4IGZpZWxkIHR5cGVzXG4gICAgICBpZiAocGx1Z2luLmZpZWxkVHlwZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBmaWVsZFR5cGUgb2YgcGx1Z2luLmZpZWxkVHlwZXMpIHtcbiAgICAgICAgICBmaWVsZFR5cGVNYXAuc2V0KGZpZWxkVHlwZS50eXBlLCBwbHVnaW4pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSW5kZXggdmFsaWRhdG9yc1xuICAgICAgaWYgKHBsdWdpbi52YWxpZGF0b3JzKSB7XG4gICAgICAgIGZvciAoY29uc3QgdmFsaWRhdG9yIG9mIHBsdWdpbi52YWxpZGF0b3JzKSB7XG4gICAgICAgICAgdmFsaWRhdG9yTWFwLnNldCh2YWxpZGF0b3IuaWQsIHZhbGlkYXRvcilcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICB1bnJlZ2lzdGVyKHBsdWdpbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIGNvbnN0IHBsdWdpbiA9IHBsdWdpbnMuZ2V0KHBsdWdpbklkKVxuICAgICAgaWYgKCFwbHVnaW4pIHJldHVyblxuXG4gICAgICAvLyBSZW1vdmUgZnJvbSBwbHVnaW5zIG1hcFxuICAgICAgcGx1Z2lucy5kZWxldGUocGx1Z2luSWQpXG5cbiAgICAgIC8vIFJlbW92ZSBmaWVsZCB0eXBlc1xuICAgICAgaWYgKHBsdWdpbi5maWVsZFR5cGVzKSB7XG4gICAgICAgIGZvciAoY29uc3QgZmllbGRUeXBlIG9mIHBsdWdpbi5maWVsZFR5cGVzKSB7XG4gICAgICAgICAgZmllbGRUeXBlTWFwLmRlbGV0ZShmaWVsZFR5cGUudHlwZSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgdmFsaWRhdG9yc1xuICAgICAgaWYgKHBsdWdpbi52YWxpZGF0b3JzKSB7XG4gICAgICAgIGZvciAoY29uc3QgdmFsaWRhdG9yIG9mIHBsdWdpbi52YWxpZGF0b3JzKSB7XG4gICAgICAgICAgdmFsaWRhdG9yTWFwLmRlbGV0ZSh2YWxpZGF0b3IuaWQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0KHBsdWdpbklkOiBzdHJpbmcpOiBQbHVnaW5EZWZpbml0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICAgIHJldHVybiBwbHVnaW5zLmdldChwbHVnaW5JZClcbiAgICB9LFxuXG4gICAgZ2V0QWxsKCk6IFBsdWdpbkRlZmluaXRpb25bXSB7XG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShwbHVnaW5zLnZhbHVlcygpKVxuICAgIH0sXG5cbiAgICBoYXNGaWVsZFR5cGUodHlwZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gZmllbGRUeXBlTWFwLmhhcyh0eXBlKVxuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSh2YWxpZGF0b3JJZDogc3RyaW5nLCB2YWx1ZTogdW5rbm93biwgY29uZmlnOiB1bmtub3duKTogeyB2YWxpZDogYm9vbGVhbjsgZXJyb3I/OiBzdHJpbmcgfSB7XG4gICAgICBjb25zdCB2YWxpZGF0b3IgPSB2YWxpZGF0b3JNYXAuZ2V0KHZhbGlkYXRvcklkKVxuICAgICAgaWYgKCF2YWxpZGF0b3IpIHtcbiAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCBlcnJvcjogYFZhbGlkYXRvciBcIiR7dmFsaWRhdG9ySWR9XCIgbm90IGZvdW5kYCB9XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB2YWxpZGF0b3IudmFsaWRhdGUodmFsdWUsIGNvbmZpZylcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHZhbGlkOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuIl19