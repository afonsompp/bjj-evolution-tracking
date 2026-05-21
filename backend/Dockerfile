# =========================
# Build stage
# =========================
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copia primeiro os arquivos de dependência (cache melhor)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copia o resto do código
COPY src ./src

# Gera o jar
RUN mvn clean package -DskipTests


# =========================
# Runtime stage
# =========================
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia o jar gerado
COPY --from=build /app/target/*.jar app.jar

# Porta padrão (Render injeta via $PORT)
EXPOSE 8080

# JVM otimizada pra container
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
