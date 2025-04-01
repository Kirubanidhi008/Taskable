import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function EditTaskScreen({ route, navigation }) {
  const { task, onTaskUpdated } = route.params; // Retrieve task details and update function from route params

  // State variables for task fields
  const [title, setTitle] = useState(task.summary);
  const [description, setDescription] = useState(task.description || "");
  const [startDate, setStartDate] = useState(
    new Date(task.start?.dateTime || task.start?.date)
  );
  const [endDate, setEndDate] = useState(
    new Date(task.end?.dateTime || task.end?.date)
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [mode, setMode] = useState("date");

  // Function to handle task update
  const handleSave = async () => {
    try {
      const { accessToken } = await GoogleSignin.getTokens(); // Retrieve Google API access token
      if (!accessToken) {
        Alert.alert("Error", "Failed to get access token");
        return;
      }

      const updatedTask = {
        summary: title,
        description,
        start: { dateTime: startDate.toISOString(), timeZone: "UTC" },
        end: { dateTime: endDate.toISOString(), timeZone: "UTC" },
      };
      // API request to update the task in Google Calendar
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Task updated successfully!");
        onTaskUpdated(updatedTask);
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to update task.");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  // Function to show the date/time picker
  const showDateTimePicker = (type, pickerMode) => {
    if (type === "start") {
      setShowStartPicker(true);
    } else {
      setShowEndPicker(true);
    }
    setMode(pickerMode);
  };

  // Handle date/time picker selection
  const onDateTimeChange = (event, selectedDate, type) => {
    if (event.type === "dismissed") {
      if (type === "start") setShowStartPicker(false);
      else setShowEndPicker(false);
      return;
    }

    if (selectedDate) {
      if (type === "start") {
        setStartDate(selectedDate);
        if (mode === "date") showDateTimePicker("start", "time");
        else setShowStartPicker(false);
      } else {
        setEndDate(selectedDate);
        if (mode === "date") showDateTimePicker("end", "time");
        else setShowEndPicker(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>📌 Title:</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter title"
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>📝 Description:</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Enter description"
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>📅 Start Time:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => showDateTimePicker("start", "date")}
        >
          <Text style={styles.buttonText}>{startDate.toLocaleString()}</Text>
        </TouchableOpacity>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode={mode}
            display="default"
            onChange={(event, date) => onDateTimeChange(event, date, "start")}
          />
        )}

        <Text style={styles.label}>⏳ End Time:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => showDateTimePicker("end", "date")}
        >
          <Text style={styles.buttonText}>{endDate.toLocaleString()}</Text>
        </TouchableOpacity>

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode={mode}
            display="default"
            onChange={(event, date) => onDateTimeChange(event, date, "end")}
          />
        )}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.buttonText}>💾 Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#240046",
    justifyContent: "center",
  },
  card: {
    flex: 1,
    backgroundColor: "#3a0ca3",
    padding: 30,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20,
    justifyContent: "flex-start",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#7209b7",
    backgroundColor: "#4a0ca3",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    color: "#fff",
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
  },
  dateButton: {
    backgroundColor: "#7209b7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  saveButton: {
    backgroundColor: "#ff007f",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
