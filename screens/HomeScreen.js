import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useFocusEffect } from "@react-navigation/native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

export default function HomeScreen({ route, navigation }) {
  const [userInfo, setUserInfo] = useState(null);
  const [events, setEvents] = useState({
    today: [],
    tomorrow: [],
    upcoming: [],
  });
  const [completedTasks, setCompletedTasks] = useState([]);
  const progressOffset = useSharedValue(0);
  const [todayStr, setTodayStr] = useState("");

  // Fetch user info from Google Sign-in
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const user = await GoogleSignin.getCurrentUser();
        setUserInfo(user);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    getUserInfo();
  }, []);

  // Fetch events from Google Calendar and categorize them
  const fetchGoogleCalendarEvents = useCallback(async () => {
    try {
      const accessToken = (await GoogleSignin.getTokens()).accessToken;
      if (!accessToken) {
        Alert.alert("Error", "Failed to get access token");
        return;
      }

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        const now = new Date();
        const todayStr = new Date().toISOString().split("T")[0]; // Ensuring today’s date is fixed
        setTodayStr(todayStr);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        const categorizedEvents = {
          overdue: [],
          today: [],
          tomorrow: [],
          upcoming: [],
        };
        const completed = [];

        (data.items || []).forEach((event) => {
          const taskEnd = new Date(event.end?.dateTime || event.end?.date);
          const endDateStr = taskEnd.toISOString().split("T")[0];

          if (event.extendedProperties?.private?.completed === "true") {
            completed.push(event);
          } else if (endDateStr < todayStr) {
            categorizedEvents.overdue.push(event);
          } else if (endDateStr === todayStr) {
            categorizedEvents.today.push(event);
          } else if (endDateStr === tomorrowStr) {
            categorizedEvents.tomorrow.push(event);
          } else {
            categorizedEvents.upcoming.push(event);
          }
        });

        setEvents(categorizedEvents);
        setCompletedTasks(completed);
      } else {
        console.error("Error fetching events:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  // Fetch events whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchGoogleCalendarEvents();
    }, [fetchGoogleCalendarEvents])
  );

  // Get the background color of a task based on its due date
  const getTaskBackgroundColor = (endDate) => {
    const now = new Date();
    const taskDate = new Date(endDate);
    if (taskDate < now) return "#d90429"; // Red for overdue
    if (taskDate.toDateString() === now.toDateString()) return "#ffba08"; // Yellow for today
    return "#3a86ff"; // Blue for upcoming
  };

  // Calculate overall and today's progress
  const totalTasks =
    events.today.length +
    events.tomorrow.length +
    events.upcoming.length +
    completedTasks.length;
  const progress = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

  // Get tasks completed today
  const todayCompletedTasks = completedTasks.filter((task) => {
    const endDate = task.end?.dateTime || task.end?.date;

    if (!endDate) return false; // Ensure there's an end date

    const endDateStr = new Date(endDate).toISOString().split("T")[0];

    return endDateStr === todayStr; // ✅ Only count completed tasks from today
  });

  const totalTodayTasks = events.today.length;
  const todayProgress =
    totalTodayTasks > 0
      ? Math.min(todayCompletedTasks.length / totalTodayTasks, 1.0)
      : 0;

  console.log("Total tasks for today:", events.today.length);
  console.log(
    "Corrected completed tasks for today:",
    todayCompletedTasks.length
  );
  console.log("Recalculated todayProgress:", todayProgress);

  // Animation for sliding progress section
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(progressOffset.value) }],
  }));

  // Format date/time for display
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "No Date Provided";

    const dateObj = new Date(dateTime);
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return dateObj.toLocaleString("en-US", options);
  };

  const CircleProgress = ({ progress, size = 100, strokeWidth = 10 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressStroke = progress * circumference;
    const percentage = Math.round(progress * 100); // Convert to percentage

    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ddd"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#00ff00"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progressStroke}
            strokeLinecap="round"
          />
        </Svg>
        {/* Display Percentage Value */}
        <Text
          style={{
            position: "absolute",
            fontSize: 18,
            fontWeight: "bold",
            color: "#fff",
          }}
        >
          {percentage}%
        </Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
      keyboardShouldPersistTaps="handled"
    >
      {userInfo && userInfo.user ? (
        <>
          <Text style={styles.welcomeText}>Welcome {userInfo.user.name}!</Text>

          <PanGestureHandler
            onGestureEvent={(event) => {
              if (event.nativeEvent.translationX < -50) {
                progressOffset.value = -300;
              } else if (event.nativeEvent.translationX > 50) {
                progressOffset.value = 0;
              }
            }}
          >
            <Animated.View style={[styles.progressContainer, animatedStyle]}>
              <View style={styles.progressCard}>
                <Text style={styles.progressText}>Overall Progress</Text>
                <CircleProgress progress={progress} />
              </View>
              <View style={styles.progressCard}>
                <Text style={styles.progressText}>Today's Progress</Text>
                <CircleProgress progress={todayProgress} />
              </View>
            </Animated.View>
          </PanGestureHandler>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddTaskScreen")}
          >
            <Text style={styles.addButtonText}>+ Add Task</Text>
          </TouchableOpacity>

          {["overdue", "today", "tomorrow", "upcoming"].map((category) => {
            const tasks = events[category] || [];
            if (tasks.length === 0) return null;

            return (
              <View key={category}>
                <Text style={styles.sectionHeader}>
                  {category === "overdue"
                    ? "⚠️ Overdue Tasks"
                    : category === "today"
                    ? "Today's Tasks"
                    : category === "tomorrow"
                    ? "Tomorrow's Tasks"
                    : "Upcoming Tasks"}
                </Text>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskItem,
                      {
                        backgroundColor: getTaskBackgroundColor(
                          task.end?.dateTime || task.end?.date
                        ),
                      },
                    ]}
                    onPress={() =>
                      navigation.navigate("TaskDetailsScreen", { task })
                    }
                  >
                    <Text style={styles.taskTitle}>{task.summary}</Text>
                    <Text style={styles.taskDate}>
                      {formatDateTime(task.end?.dateTime || task.end?.date)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}

          {/* ✅ Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <View>
              <Text style={styles.sectionHeader}>✅ Completed Tasks</Text>
              {completedTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, { backgroundColor: "#008000" }]} // Green
                  onPress={() =>
                    navigation.navigate("TaskDetailsScreen", { task })
                  }
                >
                  <Text style={styles.taskTitle}>{task.summary}</Text>
                  <Text style={styles.taskDate}>
                    {task.end?.dateTime || task.end?.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              await GoogleSignin.signOut();
              navigation.replace("SignInScreen");
            }}
          >
            <Text style={styles.signOutText}>🚪 Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.loadingText}>Loading user info...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#240046",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#f8f9fa",
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f8f9fa",
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#7209b7",
    paddingBottom: 5,
  },
  taskItem: {
    padding: 18,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  taskDate: {
    fontSize: 14,
    color: "#e0f7fa",
    marginTop: 3,
  },
  addButton: {
    backgroundColor: "#7209b7",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  signOutButton: {
    backgroundColor: "#d00000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  signOutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  progressContainer: {
    flexDirection: "row",
    width: 600,
  },
  progressCard: {
    width: 300,
    backgroundColor: "#3a0ca3",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    marginHorizontal: 5,
    marginBottom: 18,
  },
  progressText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 18,
  },
});
