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

export default function AddTaskScreen({ navigation }) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().getTime() + 60 * 60 * 1000) // Default end time is 1 hour after start
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [mode, setMode] = useState("date"); // Determines whether to show date or time picker

  // Function to add task to Google Calendar
  const addTaskToGoogleCalendar = async () => {
    try {
      const { accessToken } = await GoogleSignin.getTokens();

      if (!accessToken) {
        Alert.alert("Error", "Failed to get access token");
        return;
      }

      const event = {
        summary: taskTitle,
        description: taskDescription,
        start: { dateTime: startDate.toISOString(), timeZone: "UTC" },
        end: { dateTime: endDate.toISOString(), timeZone: "UTC" },
      };

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Task added to Google Calendar!");
        navigation.goBack();
      } else {
        const data = await response.json();
        console.error("Error adding event:", data);
        Alert.alert("Error", "Failed to add task.");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  // Function to show date/time picker
  const showDateTimePicker = (type, pickerMode) => {
    if (type === "start") setShowStartPicker(true);
    else setShowEndPicker(true);
    setMode(pickerMode);
  };

  // Handles date/time selection
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
        // If date selected, show time picker
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
        <Text style={styles.header}>📌 Add New Task</Text>

        {/* Task Title Input */}
        <TextInput
          style={styles.input}
          placeholder="Task Title"
          placeholderTextColor="#ccc"
          value={taskTitle}
          onChangeText={setTaskTitle}
        />

        {/* Task Description Input */}
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Task Description"
          placeholderTextColor="#ccc"
          value={taskDescription}
          onChangeText={setTaskDescription}
          multiline
        />
        {/* Start Time Selection */}
        <Text style={styles.label}>📅 Start Time:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => showDateTimePicker("start", "date")}
        >
          <Text style={styles.buttonText}>{startDate.toLocaleString()}</Text>
        </TouchableOpacity>

        {/* Start Date Picker */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode={mode}
            display="default"
            onChange={(event, date) => onDateTimeChange(event, date, "start")}
          />
        )}

        {/* End Time Selection */}
        <Text style={styles.label}>⏳ End Time:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => showDateTimePicker("end", "date")}
        >
          <Text style={styles.buttonText}>{endDate.toLocaleString()}</Text>
        </TouchableOpacity>

        {/* End Date Picker */}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode={mode}
            display="default"
            onChange={(event, date) => onDateTimeChange(event, date, "end")}
          />
        )}
      </View>

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={addTaskToGoogleCalendar}
      >
        <Text style={styles.buttonText}>➕ Add Task</Text>
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
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 25,
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
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 8,
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
  addButton: {
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
