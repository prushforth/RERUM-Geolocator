/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package io.rerum.crud;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import net.sf.json.JSONObject;
import io.rerum.tokens.TinyTokenManager;
import java.util.List;
import java.util.Map;


/**
 *
 * @author bhaberbe
 */
public class TinyQuery extends HttpServlet {
    /**
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code>
     * methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
        protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, Exception {
            System.out.println("Query RERUM");
                
        TinyTokenManager manager = new TinyTokenManager();
        BufferedReader bodyReader = request.getReader();
        StringBuilder bodyString = new StringBuilder();
        String line;
        StringBuilder sb = new StringBuilder();
        int codeOverwrite = 500;
        JSONObject requestJSON = new JSONObject();
        String requestString;
        boolean moveOn = false;
        //Gather user provided parameters from BODY of request, not parameters
        while ((line = bodyReader.readLine()) != null)
        {
          bodyString.append(line);
        }
        bodyReader.close();
        requestString = bodyString.toString();
        try { 
            //JSONObject test
            requestJSON = JSONObject.fromObject(requestString);
            moveOn = true;
        }
        catch(Exception ex){
            response.setStatus(500);
            response.getWriter().print(ex);
        }
        //If it was JSON
        if(moveOn){
            //Get public token for requests from property file
            String pubTok = manager.getAccessToken();
            boolean expired = manager.checkTokenExpiry();
            if(expired){
                System.out.println("Tiny thing detected an expired token, auto getting and setting a new one...");
                pubTok = manager.generateNewAccessToken();
            }
            //Point to rerum server v1
            System.out.println("GBP");
            URL postUrl = new URL(Constant.RERUM_API_ADDR + "/getByProperties.action");
            HttpURLConnection connection = (HttpURLConnection) postUrl.openConnection();
            connection.setDoOutput(true);
            connection.setDoInput(true);
            connection.setRequestMethod("POST");
            connection.setUseCaches(false);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            connection.setRequestProperty("Authorization", "Bearer "+pubTok);
            connection.connect();
            try{
                DataOutputStream out = new DataOutputStream(connection.getOutputStream());
                //Pass in the user provided JSON for the body of the rerumserver v1 request
                byte[] toWrite = requestJSON.toString().getBytes("UTF-8");
                //Pass in the user provided JSON for the body of the rerumserver v1 request
                //out.writeBytes(requestJSON.toString());
                out.write(toWrite);
                out.flush();
                out.close(); 
                codeOverwrite = connection.getResponseCode();
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), "utf-8"));
                while ((line = reader.readLine()) != null) {
                    //Gather rerum server v1 response
                    sb.append(line);
                }
                reader.close();
                System.out.println("Response from RERUM");
                System.out.println(sb.toString());
                for (Map.Entry<String, List<String>> entries : connection.getHeaderFields().entrySet()) {
                    String values = "";
                    String removeBraks = entries.getValue().toString();
                    values = removeBraks.substring(1, removeBraks.length() -1);
                    //FIXME: WHY DID I HAVE TO IGNORE CONTENT-LENGTH!
                    if(null != entries.getKey() && !entries.getKey().equals("Transfer-Encoding") && !entries.getKey().equals("Content-Length")){
                        response.setHeader(entries.getKey(), values);
                    }
                }
            }
            catch(IOException ex){
                //Need to get the response RERUM sent back.
                System.out.println("PROBLEM");
                BufferedReader error = new BufferedReader(new InputStreamReader(connection.getErrorStream(),"utf-8"));
                String errorLine = "";
                while ((errorLine = error.readLine()) != null){  
                    sb.append(errorLine);
                } 
                error.close();
            }
            connection.disconnect();
            if(manager.getAPISetting().equals("true")){
                response.setHeader("Access-Control-Allow-Origin", "*"); //To use this as an API, it must contain CORS headers
            }
            response.setStatus(codeOverwrite);
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.setCharacterEncoding("UTF-8");
            System.out.println("Put SB to writer");
            response.getWriter().print(sb.toString());
        }
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>PUT</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            processRequest(request, response);
        } catch (Exception ex) {
            Logger.getLogger(TinyQuery.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    /**
     * Handles the HTTP <code>OPTIONS</code> preflight method.
     * This should be a configurable option.  Turning this on means you
     * intend for this version of Tiny Things to work like an open API.  
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            TinyTokenManager manager = new TinyTokenManager();
            String openAPI = manager.getAPISetting();
            if(openAPI.equals("true")){
                //These headers must be present to pass browser preflight for CORS
                response.addHeader("Access-Control-Allow-Origin", "*");
                response.addHeader("Access-Control-Allow-Headers", "*");
                response.addHeader("Access-Control-Allow-Methods", "*");
            }
            response.setStatus(200);
            
        } catch (Exception ex) {
            Logger.getLogger(TinyQuery.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
