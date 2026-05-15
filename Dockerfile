FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/payment-gateway-simulator-1.0.0.jar app.jar
EXPOSE 8080

# Memory-optimised for Render free tier (512 MB RAM)
# -Xmx300m  → max heap 300 MB
# -Xss512k  → smaller thread stacks
# -XX:+UseSerialGC → single-threaded GC, less overhead on small instances
ENTRYPOINT ["java", \
  "-Xmx300m", "-Xss512k", \
  "-XX:+UseSerialGC", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
