import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Load dataset
df = pd.read_csv("telemetry_data.csv")

# Rename columns to match operational data format
df = df.rename(columns={
    "temp": "temperature",
    "error_codes": "error_count"
})

# Select features
X = df[[
    "temperature",
    "helium_pressure",
    "vibration",
    "error_count",
    "scan_volume"
]]

# Encode target labels
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(df["failure_label"])

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create XGBoost model
model = xgb.XGBClassifier(
    objective="multi:softmax",
    num_class=4,
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1,
    eval_metric="mlogloss"
)

# Train model
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)

print("Model Accuracy:", accuracy)
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "equipment_failure_model.pkl")

# Save label encoder
joblib.dump(label_encoder, "label_encoder.pkl")

print("Model saved successfully.")