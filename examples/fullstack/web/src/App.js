"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const dfe_react_1 = require("@dmc-98/dfe-react");
const components_1 = require("@dmc-98/dfe-react/components");
const API_URL = (_a = import.meta.env.VITE_API_URL) !== null && _a !== void 0 ? _a : 'http://localhost:3001/api';
function App() {
    const [formData, setFormData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [completed, setCompleted] = (0, react_1.useState)(false);
    // Fetch form definition
    (0, react_1.useEffect)(() => {
        fetch(`${API_URL}/dfe/forms/employee-onboarding`)
            .then(r => r.json())
            .then(data => {
            setFormData(data);
            setLoading(false);
        })
            .catch(err => {
            console.error('Failed to load form:', err);
            setLoading(false);
        });
    }, []);
    if (loading)
        return <div style={styles.container}><p>Loading form...</p></div>;
    if (!formData)
        return <div style={styles.container}><p>Form not found.</p></div>;
    if (completed)
        return (<div style={styles.container}>
      <h1>Thank You!</h1>
      <p>Your onboarding form has been submitted successfully.</p>
      <button onClick={() => setCompleted(false)} style={styles.button}>
        Submit Another
      </button>
    </div>);
    return <DynamicForm formData={formData} onComplete={() => setCompleted(true)}/>;
}
function DynamicForm({ formData, onComplete }) {
    var _a, _b;
    const engine = (0, dfe_react_1.useFormEngine)({
        fields: formData.fields,
    });
    const stepper = (0, dfe_react_1.useFormStepper)({
        steps: formData.steps,
        engine: engine.engine,
    });
    const runtime = (0, dfe_react_1.useFormRuntime)({
        baseUrl: API_URL,
        formId: formData.id,
        versionId: formData.versionId,
    });
    const [errors, setErrors] = (0, react_1.useState)({});
    // Create submission on mount
    (0, react_1.useEffect)(() => {
        runtime.createSubmission();
    }, []);
    // Filter fields for current step
    const currentStepId = (_a = stepper.currentStep) === null || _a === void 0 ? void 0 : _a.step.id;
    const stepFields = engine.visibleFields.filter(f => f.stepId === currentStepId);
    const handleNext = async () => {
        var _a;
        if (!currentStepId)
            return;
        // Validate
        const validation = engine.validateStep(currentStepId);
        if (!validation.success) {
            setErrors(validation.errors);
            return;
        }
        setErrors({});
        // Submit step
        const result = await runtime.submitStep(currentStepId, engine.values);
        if (!result.success) {
            setErrors((_a = result.errors) !== null && _a !== void 0 ? _a : {});
            return;
        }
        stepper.markComplete(currentStepId);
        if (stepper.isLastStep) {
            await runtime.completeSubmission();
            onComplete();
        }
        else {
            stepper.goNext();
        }
    };
    return (<div style={styles.container}>
      <h1 style={styles.title}>{formData.title}</h1>
      {formData.description && <p style={styles.description}>{formData.description}</p>}

      <components_1.DfeStepIndicator steps={stepper.visibleSteps} currentIndex={stepper.currentIndex} onStepClick={stepper.jumpTo}/>

      <div style={styles.stepContent}>
        <h2>{(_b = stepper.currentStep) === null || _b === void 0 ? void 0 : _b.step.title}</h2>

        <components_1.DfeFormRenderer fields={stepFields} values={engine.values} onFieldChange={engine.setFieldValue} errors={errors}/>

        {runtime.error && <p style={styles.error}>{runtime.error}</p>}

        <div style={styles.nav}>
          {stepper.canGoBack && (<button onClick={stepper.goBack} style={styles.buttonSecondary}>
              Back
            </button>)}
          <button onClick={handleNext} disabled={runtime.isSubmitting} style={styles.button}>
            {runtime.isSubmitting
            ? 'Submitting...'
            : stepper.isLastStep
                ? 'Submit'
                : 'Next'}
          </button>
        </div>
      </div>
    </div>);
}
const styles = {
    container: {
        maxWidth: 640,
        margin: '2rem auto',
        padding: '0 1rem',
        fontFamily: 'system-ui, sans-serif',
    },
    title: { marginBottom: '0.5rem' },
    description: { color: '#666', marginBottom: '2rem' },
    stepContent: { marginTop: '2rem' },
    nav: { display: 'flex', gap: '1rem', marginTop: '2rem' },
    button: {
        padding: '0.75rem 1.5rem',
        background: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: '1rem',
    },
    buttonSecondary: {
        padding: '0.75rem 1.5rem',
        background: '#e5e7eb',
        color: '#333',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: '1rem',
    },
    error: { color: 'red', marginTop: '1rem' },
};
exports.default = App;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBa0Q7QUFDbEQsb0RBSTZCO0FBQzdCLGdFQUFtRjtBQUduRixNQUFNLE9BQU8sR0FBRyxNQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksbUNBQUksMkJBQTJCLENBQUE7QUFZM0UsU0FBUyxHQUFHO0lBQ1YsTUFBTSxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQWtCLElBQUksQ0FBQyxDQUFBO0lBQy9ELE1BQU0sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxDQUFBO0lBQzVDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFDLEtBQUssQ0FBQyxDQUFBO0lBRWpELHdCQUF3QjtJQUN4QixJQUFBLGlCQUFTLEVBQUMsR0FBRyxFQUFFO1FBQ2IsS0FBSyxDQUFDLEdBQUcsT0FBTyxnQ0FBZ0MsQ0FBQzthQUM5QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ1gsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ2pCLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNuQixDQUFDLENBQUM7YUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQzFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNuQixDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUVOLElBQUks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RSxHQUFHLENBQ1A7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUE7QUFDSCxDQUFDO0FBRUQsTUFBTSxNQUFNLEdBQXdDO0lBQ2xELFNBQVMsRUFBRTtRQUNULFFBQVEsRUFBRSxHQUFHO1FBQ2IsTUFBTSxFQUFFLFdBQVc7UUFDbkIsT0FBTyxFQUFFLFFBQVE7UUFDakIsVUFBVSxFQUFFLHVCQUF1QjtLQUNwQztJQUNELEtBQUssRUFBRSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUU7SUFDakMsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFO0lBQ3BELFdBQVcsRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7SUFDbEMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7SUFDeEQsTUFBTSxFQUFFO1FBQ04sT0FBTyxFQUFFLGdCQUFnQjtRQUN6QixVQUFVLEVBQUUsU0FBUztRQUNyQixLQUFLLEVBQUUsT0FBTztRQUNkLE1BQU0sRUFBRSxNQUFNO1FBQ2QsWUFBWSxFQUFFLENBQUM7UUFDZixNQUFNLEVBQUUsU0FBUztRQUNqQixRQUFRLEVBQUUsTUFBTTtLQUNqQjtJQUNELGVBQWUsRUFBRTtRQUNmLE9BQU8sRUFBRSxnQkFBZ0I7UUFDekIsVUFBVSxFQUFFLFNBQVM7UUFDckIsS0FBSyxFQUFFLE1BQU07UUFDYixNQUFNLEVBQUUsTUFBTTtRQUNkLFlBQVksRUFBRSxDQUFDO1FBQ2YsTUFBTSxFQUFFLFNBQVM7UUFDakIsUUFBUSxFQUFFLE1BQU07S0FDakI7SUFDRCxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7Q0FDM0MsQ0FBQTtBQUVELGtCQUFlLEdBQUcsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQge1xuICB1c2VGb3JtRW5naW5lLFxuICB1c2VGb3JtU3RlcHBlcixcbiAgdXNlRm9ybVJ1bnRpbWUsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLXJlYWN0J1xuaW1wb3J0IHsgRGZlRm9ybVJlbmRlcmVyLCBEZmVTdGVwSW5kaWNhdG9yIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtcmVhY3QvY29tcG9uZW50cydcbmltcG9ydCB0eXBlIHsgRm9ybUZpZWxkLCBGb3JtU3RlcCB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLXJlYWN0J1xuXG5jb25zdCBBUElfVVJMID0gaW1wb3J0Lm1ldGEuZW52LlZJVEVfQVBJX1VSTCA/PyAnaHR0cDovL2xvY2FsaG9zdDozMDAxL2FwaSdcblxuaW50ZXJmYWNlIEZvcm1EYXRhIHtcbiAgaWQ6IHN0cmluZ1xuICBzbHVnOiBzdHJpbmdcbiAgdGl0bGU6IHN0cmluZ1xuICBkZXNjcmlwdGlvbjogc3RyaW5nIHwgbnVsbFxuICB2ZXJzaW9uSWQ6IHN0cmluZ1xuICBzdGVwczogRm9ybVN0ZXBbXVxuICBmaWVsZHM6IEZvcm1GaWVsZFtdXG59XG5cbmZ1bmN0aW9uIEFwcCgpIHtcbiAgY29uc3QgW2Zvcm1EYXRhLCBzZXRGb3JtRGF0YV0gPSB1c2VTdGF0ZTxGb3JtRGF0YSB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpXG4gIGNvbnN0IFtjb21wbGV0ZWQsIHNldENvbXBsZXRlZF0gPSB1c2VTdGF0ZShmYWxzZSlcblxuICAvLyBGZXRjaCBmb3JtIGRlZmluaXRpb25cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBmZXRjaChgJHtBUElfVVJMfS9kZmUvZm9ybXMvZW1wbG95ZWUtb25ib2FyZGluZ2ApXG4gICAgICAudGhlbihyID0+IHIuanNvbigpKVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIHNldEZvcm1EYXRhKGRhdGEpXG4gICAgICAgIHNldExvYWRpbmcoZmFsc2UpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGZvcm06JywgZXJyKVxuICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKVxuICAgICAgfSlcbiAgfSwgW10pXG5cbiAgaWYgKGxvYWRpbmcpIHJldHVybiA8ZGl2IHN0eWxlPXtzdHlsZXMuY29udGFpbmVyfT48cD5Mb2FkaW5nIGZvcm0uLi48L3A+PC9kaXY+XG4gIGlmICghZm9ybURhdGEpIHJldHVybiA8ZGl2IHN0eWxlPXtzdHlsZXMuY29udGFpbmVyfT48cD5Gb3JtIG5vdCBmb3VuZC48L3A+PC9kaXY+XG4gIGlmIChjb21wbGV0ZWQpIHJldHVybiAoXG4gICAgPGRpdiBzdHlsZT17c3R5bGVzLmNvbnRhaW5lcn0+XG4gICAgICA8aDE+VGhhbmsgWW91ITwvaDE+XG4gICAgICA8cD5Zb3VyIG9uYm9hcmRpbmcgZm9ybSBoYXMgYmVlbiBzdWJtaXR0ZWQgc3VjY2Vzc2Z1bGx5LjwvcD5cbiAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0Q29tcGxldGVkKGZhbHNlKX0gc3R5bGU9e3N0eWxlcy5idXR0b259PlxuICAgICAgICBTdWJtaXQgQW5vdGhlclxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gIClcblxuICByZXR1cm4gPER5bmFtaWNGb3JtIGZvcm1EYXRhPXtmb3JtRGF0YX0gb25Db21wbGV0ZT17KCkgPT4gc2V0Q29tcGxldGVkKHRydWUpfSAvPlxufVxuXG5mdW5jdGlvbiBEeW5hbWljRm9ybSh7IGZvcm1EYXRhLCBvbkNvbXBsZXRlIH06IHsgZm9ybURhdGE6IEZvcm1EYXRhOyBvbkNvbXBsZXRlOiAoKSA9PiB2b2lkIH0pIHtcbiAgY29uc3QgZW5naW5lID0gdXNlRm9ybUVuZ2luZSh7XG4gICAgZmllbGRzOiBmb3JtRGF0YS5maWVsZHMsXG4gIH0pXG5cbiAgY29uc3Qgc3RlcHBlciA9IHVzZUZvcm1TdGVwcGVyKHtcbiAgICBzdGVwczogZm9ybURhdGEuc3RlcHMsXG4gICAgZW5naW5lOiBlbmdpbmUuZW5naW5lLFxuICB9KVxuXG4gIGNvbnN0IHJ1bnRpbWUgPSB1c2VGb3JtUnVudGltZSh7XG4gICAgYmFzZVVybDogQVBJX1VSTCxcbiAgICBmb3JtSWQ6IGZvcm1EYXRhLmlkLFxuICAgIHZlcnNpb25JZDogZm9ybURhdGEudmVyc2lvbklkLFxuICB9KVxuXG4gIGNvbnN0IFtlcnJvcnMsIHNldEVycm9yc10gPSB1c2VTdGF0ZTxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+Pih7fSlcblxuICAvLyBDcmVhdGUgc3VibWlzc2lvbiBvbiBtb3VudFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJ1bnRpbWUuY3JlYXRlU3VibWlzc2lvbigpXG4gIH0sIFtdKVxuXG4gIC8vIEZpbHRlciBmaWVsZHMgZm9yIGN1cnJlbnQgc3RlcFxuICBjb25zdCBjdXJyZW50U3RlcElkID0gc3RlcHBlci5jdXJyZW50U3RlcD8uc3RlcC5pZFxuICBjb25zdCBzdGVwRmllbGRzID0gZW5naW5lLnZpc2libGVGaWVsZHMuZmlsdGVyKGYgPT4gZi5zdGVwSWQgPT09IGN1cnJlbnRTdGVwSWQpXG5cbiAgY29uc3QgaGFuZGxlTmV4dCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIWN1cnJlbnRTdGVwSWQpIHJldHVyblxuXG4gICAgLy8gVmFsaWRhdGVcbiAgICBjb25zdCB2YWxpZGF0aW9uID0gZW5naW5lLnZhbGlkYXRlU3RlcChjdXJyZW50U3RlcElkKVxuICAgIGlmICghdmFsaWRhdGlvbi5zdWNjZXNzKSB7XG4gICAgICBzZXRFcnJvcnModmFsaWRhdGlvbi5lcnJvcnMpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgc2V0RXJyb3JzKHt9KVxuXG4gICAgLy8gU3VibWl0IHN0ZXBcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBydW50aW1lLnN1Ym1pdFN0ZXAoY3VycmVudFN0ZXBJZCwgZW5naW5lLnZhbHVlcylcbiAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICBzZXRFcnJvcnMocmVzdWx0LmVycm9ycyA/PyB7fSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHN0ZXBwZXIubWFya0NvbXBsZXRlKGN1cnJlbnRTdGVwSWQpXG5cbiAgICBpZiAoc3RlcHBlci5pc0xhc3RTdGVwKSB7XG4gICAgICBhd2FpdCBydW50aW1lLmNvbXBsZXRlU3VibWlzc2lvbigpXG4gICAgICBvbkNvbXBsZXRlKClcbiAgICB9IGVsc2Uge1xuICAgICAgc3RlcHBlci5nb05leHQoKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBzdHlsZT17c3R5bGVzLmNvbnRhaW5lcn0+XG4gICAgICA8aDEgc3R5bGU9e3N0eWxlcy50aXRsZX0+e2Zvcm1EYXRhLnRpdGxlfTwvaDE+XG4gICAgICB7Zm9ybURhdGEuZGVzY3JpcHRpb24gJiYgPHAgc3R5bGU9e3N0eWxlcy5kZXNjcmlwdGlvbn0+e2Zvcm1EYXRhLmRlc2NyaXB0aW9ufTwvcD59XG5cbiAgICAgIDxEZmVTdGVwSW5kaWNhdG9yXG4gICAgICAgIHN0ZXBzPXtzdGVwcGVyLnZpc2libGVTdGVwc31cbiAgICAgICAgY3VycmVudEluZGV4PXtzdGVwcGVyLmN1cnJlbnRJbmRleH1cbiAgICAgICAgb25TdGVwQ2xpY2s9e3N0ZXBwZXIuanVtcFRvfVxuICAgICAgLz5cblxuICAgICAgPGRpdiBzdHlsZT17c3R5bGVzLnN0ZXBDb250ZW50fT5cbiAgICAgICAgPGgyPntzdGVwcGVyLmN1cnJlbnRTdGVwPy5zdGVwLnRpdGxlfTwvaDI+XG5cbiAgICAgICAgPERmZUZvcm1SZW5kZXJlclxuICAgICAgICAgIGZpZWxkcz17c3RlcEZpZWxkc31cbiAgICAgICAgICB2YWx1ZXM9e2VuZ2luZS52YWx1ZXN9XG4gICAgICAgICAgb25GaWVsZENoYW5nZT17ZW5naW5lLnNldEZpZWxkVmFsdWV9XG4gICAgICAgICAgZXJyb3JzPXtlcnJvcnN9XG4gICAgICAgIC8+XG5cbiAgICAgICAge3J1bnRpbWUuZXJyb3IgJiYgPHAgc3R5bGU9e3N0eWxlcy5lcnJvcn0+e3J1bnRpbWUuZXJyb3J9PC9wPn1cblxuICAgICAgICA8ZGl2IHN0eWxlPXtzdHlsZXMubmF2fT5cbiAgICAgICAgICB7c3RlcHBlci5jYW5Hb0JhY2sgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtzdGVwcGVyLmdvQmFja30gc3R5bGU9e3N0eWxlcy5idXR0b25TZWNvbmRhcnl9PlxuICAgICAgICAgICAgICBCYWNrXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZU5leHR9XG4gICAgICAgICAgICBkaXNhYmxlZD17cnVudGltZS5pc1N1Ym1pdHRpbmd9XG4gICAgICAgICAgICBzdHlsZT17c3R5bGVzLmJ1dHRvbn1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7cnVudGltZS5pc1N1Ym1pdHRpbmdcbiAgICAgICAgICAgICAgPyAnU3VibWl0dGluZy4uLidcbiAgICAgICAgICAgICAgOiBzdGVwcGVyLmlzTGFzdFN0ZXBcbiAgICAgICAgICAgICAgICA/ICdTdWJtaXQnXG4gICAgICAgICAgICAgICAgOiAnTmV4dCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIFJlYWN0LkNTU1Byb3BlcnRpZXM+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBtYXhXaWR0aDogNjQwLFxuICAgIG1hcmdpbjogJzJyZW0gYXV0bycsXG4gICAgcGFkZGluZzogJzAgMXJlbScsXG4gICAgZm9udEZhbWlseTogJ3N5c3RlbS11aSwgc2Fucy1zZXJpZicsXG4gIH0sXG4gIHRpdGxlOiB7IG1hcmdpbkJvdHRvbTogJzAuNXJlbScgfSxcbiAgZGVzY3JpcHRpb246IHsgY29sb3I6ICcjNjY2JywgbWFyZ2luQm90dG9tOiAnMnJlbScgfSxcbiAgc3RlcENvbnRlbnQ6IHsgbWFyZ2luVG9wOiAnMnJlbScgfSxcbiAgbmF2OiB7IGRpc3BsYXk6ICdmbGV4JywgZ2FwOiAnMXJlbScsIG1hcmdpblRvcDogJzJyZW0nIH0sXG4gIGJ1dHRvbjoge1xuICAgIHBhZGRpbmc6ICcwLjc1cmVtIDEuNXJlbScsXG4gICAgYmFja2dyb3VuZDogJyMyNTYzZWInLFxuICAgIGNvbG9yOiAnd2hpdGUnLFxuICAgIGJvcmRlcjogJ25vbmUnLFxuICAgIGJvcmRlclJhZGl1czogNixcbiAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICBmb250U2l6ZTogJzFyZW0nLFxuICB9LFxuICBidXR0b25TZWNvbmRhcnk6IHtcbiAgICBwYWRkaW5nOiAnMC43NXJlbSAxLjVyZW0nLFxuICAgIGJhY2tncm91bmQ6ICcjZTVlN2ViJyxcbiAgICBjb2xvcjogJyMzMzMnLFxuICAgIGJvcmRlcjogJ25vbmUnLFxuICAgIGJvcmRlclJhZGl1czogNixcbiAgICBjdXJzb3I6ICdwb2ludGVyJyxcbiAgICBmb250U2l6ZTogJzFyZW0nLFxuICB9LFxuICBlcnJvcjogeyBjb2xvcjogJ3JlZCcsIG1hcmdpblRvcDogJzFyZW0nIH0sXG59XG5cbmV4cG9ydCBkZWZhdWx0IEFwcFxuIl19