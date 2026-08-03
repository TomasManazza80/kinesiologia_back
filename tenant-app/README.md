# Tenant Management Application

This project is a simple tenant management application built with TypeScript and Express. It allows users to create and manage tenant information through a web interface.

## Project Structure

```
tenant-app
├── src
│   ├── app.ts                # Entry point of the application
│   ├── controllers
│   │   └── tenantController.ts # Handles tenant-related operations
│   ├── routes
│   │   └── tenantRoutes.ts    # Defines routes for tenant operations
│   └── types
│       └── tenant.ts          # Defines the Tenant interface
├── public
│   └── index.html             # HTML form for creating a new tenant
├── package.json                # npm configuration file
├── tsconfig.json              # TypeScript configuration file
└── README.md                  # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd tenant-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the application:
   ```
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000` to access the application.

3. Use the form on the homepage to create a new tenant by filling in the required details and submitting the form.

## API Endpoints

- `POST /tenants`: Create a new tenant with the provided details.

## Contributing

Feel free to submit issues or pull requests for any improvements or bug fixes.

## License

This project is licensed under the MIT License.