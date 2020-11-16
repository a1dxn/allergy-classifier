#Run for each allergy to balance and split into train/test CSV files.

setwd("~/Documents/Brunel Work/Level 3/FYP/allergy-classifier/datasets")
rm(list = ls())
data <- read.csv("Original Sets/SanitisedDataset.csv")
#trainingData = read.csv("WHEAT_TRAIN.csv")
#testData = read.csv("WHEAT_TEST.csv")


#Resample to 1:1 ratio
specificAllergyData <- data

specificAllergyData <- data[data[, "WHEAT"] == 1,]
negSpecificData     <- data[data[, "WHEAT"] == 0,]
negSpecificData     <- negSpecificData[sample(nrow(specificAllergyData)),]
specificAllergyData <- rbind(specificAllergyData, negSpecificData)
specificAllergyData <- specificAllergyData[sample(nrow(specificAllergyData)),]
rm(negSpecificData)
class        <- specificAllergyData$WHEAT
values       <- specificAllergyData
values$WHEAT <- NULL

#Splitting into train/test datasets 70/20
cutoff       <- floor(length(specificAllergyData[, 1]) * 0.7)
trainingData <- specificAllergyData[1:cutoff,]
testData     <- specificAllergyData[cutoff:length(specificAllergyData[, 1]),]

TrainingClass        <- trainingData$WHEAT
TrainingValues       <- trainingData
TrainingValues$WHEAT <- NULL

TestClass        <- testData$WHEAT
TestValues       <- testData
TestValues$WHEAT <- NULL

#Just getting to grips with the dataset's accuracy using Random Forest
library(randomForest)
fit <- randomForest(x = TrainingValues, y = TrainingClass, ntree = 50, type = "classification")
print(fit)
importance(fit)
y_pred         <- predict(fit, TestValues, type = "class")
y_pred         <- round(y_pred)
forestAccuracy <- sum(y_pred == TestClass) / length(TestClass)
print(forestAccuracy)

cm <- table(TestClass, y_pred)
print(cm)


#WRITE DATA
write.csv(trainingData, "WHEAT_TRAIN.csv", row.names = FALSE)
write.csv(testData, "WHEAT_TEST.csv", row.names = FALSE)

