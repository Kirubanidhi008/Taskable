import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export default function TaskDetailsScreen({ route, navigation }) {
  const { task: initialTask } = route.params;
  const [task, setTask] = useState(initialTask);
  const [isCompleted, setIsCompleted] = useState(
    task.extendedProperties?.private?.completed === "true"
  );

  // Update task details when navigating back from edit screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (route.params.updatedTask) {
        setTask(route.params.updatedTask);
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  // Toggle task completion status
  const toggleCompletion = async () => {
    try {
      const newStatus = !isCompleted;
      const { accessToken } = await GoogleSignin.getTokens();
      if (!accessToken) {
        Alert.alert("Error", "Failed to get access token");
        return;
      }

      // Update task in Google Calendar
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            extendedProperties: {
              private: { completed: newStatus.toString() },
            },
          }),
        }
      );

      if (response.ok) {
        setIsCompleted(newStatus);
        Alert.alert(
          "Success",
          newStatus ? "Task marked as completed" : "Task marked as incomplete"
        );
      } else {
        Alert.alert("Error", "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  // Format date and time for display
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "No Date Provided";

    const dateObj = new Date(dateTime);
    const options = {
      year: "numeric",
      month: "short", // e.g., "Jan"
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true, // Enable 12-hour format
    };
    return dateObj.toLocaleString("en-US", options);
  };

  // Handle task deletion
  const handleDelete = async () => {
    Alert.alert("Confirm", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { accessToken } = await GoogleSignin.getTokens();
            if (!accessToken) {
              Alert.alert("Error", "Failed to get access token");
              return;
            }

            // Delete task from Google Calendar
            const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            if (response.ok) {
              Alert.alert("Deleted", "Task deleted successfully");
              navigation.goBack();
            } else {
              Alert.alert("Error", "Failed to delete task");
            }
          } catch (error) {
            console.error("Error deleting task:", error);
            Alert.alert("Error", "Something went wrong");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{task.summary}</Text>

        {/* Display task start time */}
        <View style={styles.detailItem}>
          <Text style={styles.label}>📅 Start:</Text>
          <Text style={styles.value}>
            {formatDateTime(task.start?.dateTime || task.start?.date)}
          </Text>
        </View>

        {/* Display task end time */}
        <View style={styles.detailItem}>
          <Text style={styles.label}>⏳ End:</Text>
          <Text style={styles.value}>
            {formatDateTime(task.end?.dateTime || task.end?.date)}
          </Text>
        </View>

        {/* Display task description */}
        <View style={styles.detailItem}>
          <Text style={styles.label}>📝 Description:</Text>
          <Text style={[styles.value, styles.descriptionText]}>
            {task.description || "No description provided"}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {/* Button to navigate to edit task screen */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate("EditTaskScreen", {
              task,
              onTaskUpdated: (updatedTask) => setTask(updatedTask),
            })
          }
        >
          <Text style={styles.buttonText}>✏️ Edit Task</Text>
        </TouchableOpacity>

        {/* Button to toggle task completion */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            isCompleted ? styles.completed : styles.notCompleted,
          ]}
          onPress={toggleCompletion}
        >
          <Text style={styles.buttonText}>
            {isCompleted ? "✅ Completed" : "Mark as Complete"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Button to delete task */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.buttonText}>🗑️ Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#240046",
    // justifyContent: "center",
  },
  card: {
    flex: 1,
    backgroundColor: "#560bad",
    padding: 30,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "100%",
    paddingVertical: 50,
  },
  title: {
    fontSize: 33,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    textAlign: "center",
    textTransform: "capitalize",
  },
  detailItem: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f8f9fa",
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: "#d6d6f5",
    textAlign: "left",
    paddingLeft: 30,
  },
  descriptionText: {
    fontStyle: "italic",
    color: "#ccc",
  },

  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#d00000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  editButton: {
    backgroundColor: "#7209b7",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "48%",
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "48%",
  },
  completed: {
    backgroundColor: "#008000",
  },
  notCompleted: {
    backgroundColor: "#d00000",
  },
});
