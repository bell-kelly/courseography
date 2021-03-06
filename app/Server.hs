{-|
Description: Configure and run the server for Courseography.
This module defines the configuration for the server, including logging.
It also defines all of the allowed server routes, and the corresponding
responses.
-}
module Server
    (runServer) where

import Control.Monad (msum)
import Happstack.Server hiding (host)
import Response (notFoundResponse)
import Filesystem.Path.CurrentOS as Path
import System.Directory (getCurrentDirectory)
import System.IO (hSetBuffering, stdout, stderr, BufferMode(LineBuffering))
import System.Log.Logger (updateGlobalLogger, rootLoggerName, setLevel, Priority(INFO))
import Data.String (fromString)
import Config (markdownPath, serverConf)
import qualified Data.Text.Lazy.IO as LazyIO
import Routes (routes)

runServer :: IO ()
runServer = do
    configureLogger
    staticDir <- getStaticDir
    aboutContents <- LazyIO.readFile $ markdownPath ++ "README.md"
    privacyContents <- LazyIO.readFile $ markdownPath ++ "PRIVACY.md"

    -- Start the HTTP server
    simpleHTTP serverConf $ do
      decodeBody (defaultBodyPolicy "/tmp/" 4096 4096 4096)
      msum
           ((map (uncurry dir) $ routes staticDir aboutContents privacyContents ) ++
           [ do
              nullDir
              seeOther "graph" (toResponse "Redirecting to /graph"),
              notFoundResponse
        ])
    where
    -- | Global logger configuration.
    configureLogger :: IO ()
    configureLogger = do
        -- Use line buffering to ensure logging messages are printed correctly
        hSetBuffering stdout LineBuffering
        hSetBuffering stderr LineBuffering
        -- Set log level to INFO so requests are logged to stdout
        updateGlobalLogger rootLoggerName $ setLevel INFO

    -- | Return the directory where all static files are stored.
    -- Note: the type here is System.IO.FilePath, not FileSystem.Path.FilePath.
    getStaticDir :: IO Prelude.FilePath
    getStaticDir = do
        cwd <- getCurrentDirectory
        --let parentDir = Path.parent $ Path.decodeString cwd
        --return $ Path.encodeString $ Path.append parentDir $ fromString "public/"
        return $ Path.encodeString $ Path.append (Path.decodeString cwd) $ fromString "public/"
