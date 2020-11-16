#Take the original food_allergies dataset, remove unwanted data and compress into a workable format!

setwd("~/Documents/Brunel Work/Level 3/FYP/allergy-classifier/datasets")
data <- read.csv("Original Sets/food_allergies.csv")
#---Data Preprocessing---

#If age is less than 14 then delete the row
data <- subset(data, data[, 7] >= 10)

#get rid of the subject info
data <- data[8:39]

#Delete empty rows
data <- data[rowSums(is.na(data)) != ncol(data),]

#Replace NA with 0
data[is.na(data)] <- 0

#library(tidyr)
sanitisedData <- setNames(data.frame(matrix(ncol = 9, nrow = 0)), c("EGG", "FISH", "MILK", "NUT", "PEANUT", "SESAME", "SHELLFISH", "SOYA", "WHEAT"))


for(i in seq(1, length(data[, 1]), 1)) {
  #print(data[i,])

  SHELLFISH <- 0
  if(rowSums(data[i, 1:2]) > 0) SHELLFISH <- 1
  FISH <- 0
  if(rowSums(data[i, 3:4]) > 0) FISH <- 1
  MILK <- 0
  if(rowSums(data[i, 5:6]) > 0) MILK <- 1
  SOYA <- 0
  if(rowSums(data[i, 7:8]) > 0) SOYA <- 1
  EGG <- 0
  if(rowSums(data[i, 9:10]) > 0) EGG <- 1
  WHEAT <- 0
  if(rowSums(data[i, 11:12]) > 0) WHEAT <- 1
  PEANUT <- 0
  if(rowSums(data[i, 13:14]) > 0) PEANUT <- 1
  SESAME <- 0
  if(rowSums(data[i, 15:16]) > 0) SESAME <- 1
  NUTS <- 0
  if(rowSums(data[i, 17:32]) > 0) NUTS <- 1

  output        <- data.frame(EGG, FISH, MILK, NUTS, PEANUT, SESAME, SHELLFISH, SOYA, WHEAT)
  sanitisedData <- rbind(sanitisedData, output)
}
rm(output)
sanitisedData <- sanitisedData[sample(nrow(sanitisedData)),]
write.csv(sanitisedData, "sanitisedDataset.csv", row.names = FALSE)

#--End of Data Preprocessing--


